import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Food from '../models/Food.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import { generateOtp } from '../utils/token.js';
import { paginate, round2 } from '../utils/helpers.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
import { isRazorpayConfigured, verifyRazorpaySignature } from '../services/razorpayService.js';

/**
 * Find an order by either its orderNumber (e.g. "FHxxxxxx") or Mongo _id.
 * Order numbers never collide with ObjectIds, so we must NOT attempt to cast
 * a bare orderNumber to an ObjectId (which throws a CastError).
 */
const findOrderByIdentifier = (identifier) => {
  const filter = mongoose.isValidObjectId(identifier)
    ? { _id: identifier }
    : { orderNumber: identifier };
  return Order.findOne(filter);
};

/**
 * Make sure an OTP exists (called when an order moves into out_for_delivery).
 * The OTP is issued to the customer only at that stage.
 */
const ensureOtp = (order) => {
  if (!order.deliveryOtp) order.deliveryOtp = generateOtp(4);
  return order;
};

/**
 * Calculate order totals from items + settings (delivery, packaging, tax)
 * and optional coupon. Returns breakdown used by both checkout and preview.
 */
const calculateTotals = async (items, { couponCode, userId, paymentMethod } = {}) => {
  const settings = await Settings.getSettings();

  const foodIds = items.map((i) => i.food);
  const foods = await Food.find({ _id: { $in: foodIds } }).lean({ virtuals: true });
  const foodMap = new Map(foods.map((f) => [String(f._id), f]));

  const orderItems = [];
  let subTotal = 0;
  for (const item of items) {
    const food = foodMap.get(String(item.food));
    if (!food) throw new NotFoundError(`Food not found: ${item.food}`);
    if (!food.isAvailable) throw new ValidationError(`"${food.name}" is currently unavailable`);
    if (food.stock && food.stock < item.quantity) {
      throw new ConflictError(`Only ${food.stock} unit(s) of "${food.name}" available`);
    }
    const price = food.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food.price;
    const lineTotal = round2(price * item.quantity);
    subTotal += lineTotal;
    orderItems.push({
      food: food._id, name: food.name,
      image: food.primaryImage || food.images?.[0] || '',
      price, quantity: item.quantity, isVeg: food.isVeg, lineTotal,
    });
  }
  subTotal = round2(subTotal);

  // Free delivery for online payments (razorpay/UPI) + above the threshold.
  const isOnline = paymentMethod === 'razorpay' || paymentMethod === 'upi';
  const freeOnlineDelivery = (settings.delivery.freeDeliveryViaOnlinePayment ?? true) && isOnline;
  const deliveryCharge = freeOnlineDelivery || subTotal >= settings.delivery.freeDeliveryThreshold ? 0 : settings.delivery.baseCharge;
  const packagingCharge = round2(settings.charges.packagingCharge || 0);
  const tax = round2((subTotal * (settings.charges.taxPercent || 0)) / 100);

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new ValidationError('Invalid coupon code');
    let userUsageCount = 0;
    if (userId) userUsageCount = await Order.countDocuments({ user: userId, couponCode: coupon.code });
    const validity = coupon.isValid(subTotal, userUsageCount);
    if (!validity.valid) throw new ValidationError(validity.message);
    discount = round2(coupon.calculateDiscount(subTotal));
  }

  const grandTotal = round2(Math.max(0, subTotal + deliveryCharge + packagingCharge + tax - discount));
  return { items: orderItems, subTotal, deliveryCharge, packagingCharge, tax, discount, grandTotal, coupon, settings };
};

export const previewCheckout = async (req, res) => {
  const { items, couponCode, paymentMethod } = req.body;
  const b = await calculateTotals(items, { couponCode, userId: req.user?._id, paymentMethod });
  return res.status(200).json({
    success: true, status: 200,
    data: {
      items: b.items, subTotal: b.subTotal, deliveryCharge: b.deliveryCharge,
      packagingCharge: b.packagingCharge, tax: b.tax, discount: b.discount,
      grandTotal: b.grandTotal, couponCode: b.coupon?.code || '',
      freeDeliveryThreshold: b.settings.delivery.freeDeliveryThreshold,
      freeDeliveryMessage: b.settings.delivery.freeDeliveryMessage || 'Free delivery on online payments & orders above ₹' + b.settings.delivery.freeDeliveryThreshold,
    },
  });
};

export const applyCoupon = async (req, res) => {
  const { code, subTotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new NotFoundError('Coupon not found or inactive');
  let userUsageCount = 0;
  if (req.user) userUsageCount = await Order.countDocuments({ user: req.user._id, couponCode: coupon.code });
  const validity = coupon.isValid(subTotal, userUsageCount);
  if (!validity.valid) throw new ValidationError(validity.message);
  const discount = round2(coupon.calculateDiscount(subTotal));
  return res.status(200).json({
    success: true, status: 200, message: 'Coupon applied',
    data: { code: coupon.code, discount, type: coupon.type, value: coupon.value },
  });
};

/**
 * Create an order (checkout). COD is fully functional; razorpay/stripe
 * return a gateway order id to be confirmed on the client via confirmPayment.
 */
export const createOrder = async (req, res) => {
  const { items, addressId, address, paymentMethod, couponCode, notes, scheduleFor } = req.body;
  const user = await User.findById(req.user._id);

  let deliveryAddress = address;
  if (addressId) {
    const found = user.addresses.id(addressId);
    if (!found) throw new NotFoundError('Address not found');
    deliveryAddress = found;
  }
  if (!deliveryAddress || !deliveryAddress.line1) {
    throw new ValidationError('A delivery address is required');
  }

  const b = await calculateTotals(items, { couponCode, userId: req.user._id, paymentMethod });

  // Reject online payment methods when the gateway isn't configured, so an
  // order is never left stuck in "pending" that can't actually be paid.
  const isOnline = paymentMethod === 'razorpay' || paymentMethod === 'upi';
  if (isOnline && !isRazorpayConfigured()) {
    throw new ValidationError('Online payments are not configured on the server. Please use Cash on Delivery.');
  }

  const payment = {
    method: paymentMethod,
    status: paymentMethod === 'cod' ? 'cod' : 'pending',
    transactionId: '',
    paidAt: null,
    gatewayResponse: {},
  };
  if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
    payment.gatewayResponse = { gateway: 'razorpay', note: 'Awaiting gateway verification' };
  }

  const order = await Order.create({
    user: req.user._id,
    items: b.items,
    address: deliveryAddress,
    subTotal: b.subTotal, deliveryCharge: b.deliveryCharge, packagingCharge: b.packagingCharge,
    tax: b.tax, discount: b.discount, grandTotal: b.grandTotal,
    coupon: b.coupon?._id || null, couponCode: b.coupon?.code || '',
    payment, notes: notes || '',
    expectedDeliveryTime: scheduleFor ? new Date(scheduleFor) : null,
  });

  order.addTrackingEvent('pending', 'Order placed', req.user._id);
  await order.save();

  // Decrement stock + increment coupon usage
  for (const item of b.items) {
    await Food.updateOne({ _id: item.food }, { $inc: { stock: -item.quantity } });
  }
  if (b.coupon) await Coupon.updateOne({ _id: b.coupon._id }, { $inc: { usedCount: 1 } });

  sendOrderConfirmationEmail(user.email, order).catch(() => {});

  return res.status(201).json({
    success: true, status: 201, message: 'Order placed successfully',
    data: { order: order.toJSON() },
  });
};


/** Confirm a gateway payment after client SDK success (razorpay/upi).
 *  Online payments are only trusted after the Razorpay signature is verified
 *  server-side; COD orders are already recorded and cannot be "confirmed". */
export const confirmPayment = async (req, res) => {
  const { transactionId, gatewayResponse } = req.body;
  const orderId = req.params.id || req.body.orderId;
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ForbiddenError('Not allowed');
  }
  if (order.payment.method === 'cod') {
    throw new ValidationError('Cash on Delivery orders do not need payment confirmation');
  }
  if (order.payment.status === 'paid') {
    throw new ValidationError('Order is already paid');
  }
  const g = gatewayResponse || {};
  const verified =
    order.payment.method === 'razorpay' || order.payment.method === 'upi'
      ? verifyRazorpaySignature({ orderId: g.razorpayOrderId, paymentId: g.razorpayPaymentId, signature: g.razorpaySignature })
      : false;
  if (!verified) {
    throw new ValidationError('Payment verification failed. Please retry or contact support.');
  }
  order.payment.status = 'paid';
  order.payment.transactionId = transactionId || g.razorpayPaymentId;
  order.payment.paidAt = new Date();
  order.payment.gatewayResponse = { ...order.payment.gatewayResponse, ...g };
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Payment confirmed', data: { order: order.toJSON() } });
};

// ============ USER-FACING ============

export const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  let q = Order.find(filter).sort({ createdAt: -1 });
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const getOrderForUser = async (req, res) => {
  const order = await findOrderByIdentifier(req.params.id).populate('deliveryPartner', 'name phone deliveryProfile.rating');
  if (!order) throw new NotFoundError('Order not found');
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'delivery') {
    throw new ForbiddenError('Not allowed to view this order');
  }
  const orderObj = order.toJSON();
  const isOwner = String(order.user) === String(req.user._id);
  // The OTP is only revealed to the customer, and only once the order is out for delivery.
  if (isOwner && order.status === 'out_for_delivery') {
    orderObj.deliveryOtp = order.deliveryOtp;
  }
  return res.status(200).json({ success: true, status: 200, data: { order: orderObj } });
};

export const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  if (String(order.user) !== String(req.user._id)) throw new ForbiddenError('Not allowed');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new ValidationError('Order cannot be cancelled at this stage');
  }
  order.addTrackingEvent('cancelled', reason || 'Cancelled by customer', req.user._id);
  order.setAllItemsStatus('cancelled');
  order.syncStatusFromItems();
  order.cancelReason = reason || '';
  await order.save();
  for (const item of order.items) {
    await Food.updateOne({ _id: item.food }, { $inc: { stock: item.quantity } });
  }
  return res.status(200).json({ success: true, status: 200, message: 'Order cancelled', data: { order: order.toJSON() } });
};



// ============ ADMIN ORDER MANAGEMENT ============

export const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter['payment.status'] = paymentStatus;
  if (q) {
    filter.$or = [
      { orderNumber: new RegExp(q, 'i') },
    ];
  }
  let query = Order.find(filter).sort({ createdAt: -1 }).populate('user', 'name email phone').populate('deliveryPartner', 'name');
  const result = await paginate(query, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const updateOrderStatus = async (req, res) => {
  const { status, message, location } = req.body;
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  order.setAllItemsStatus(status);
  order.addTrackingEvent(status, message || `Status updated to ${status}`, req.user._id, location || null);
  order.syncStatusFromItems();
  if (order.status === 'out_for_delivery') ensureOtp(order);
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Order status updated', data: { order: order.toJSON() } });
};

/** Update the status of a single item (food) within an order. */
export const updateItemStatus = async (req, res) => {
  const { status } = req.body;
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');

  const raw = req.params.itemId;
  let item = null;
  if (mongoose.isValidObjectId(raw)) {
    item = order.items.find((it) => it._id && String(it._id) === raw) || null;
  }
  if (!item && /^\d+$/.test(raw)) {
    const idx = Number(raw);
    if (idx < order.items.length) {
      item = order.items[idx];
      if (!item._id) item._id = new mongoose.Types.ObjectId();
    }
  }
  if (!item) throw new NotFoundError('Order item not found');

  const previous = item.status || 'pending';
  item.status = status;
  order.tracking.push({ status: order.status, message: `Item "${item.name}" → ${status} (was ${previous})`, by: req.user._id, at: new Date() });
  order.syncStatusFromItems();
  if (order.status === 'out_for_delivery') ensureOtp(order);
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Item status updated', data: { order: order.toJSON() } });
};

export const assignDelivery = async (req, res) => {
  const { deliveryPartnerId } = req.body;
  const partner = await User.findOne({ _id: deliveryPartnerId, role: 'delivery' });
  if (!partner) throw new NotFoundError('Delivery partner not found');
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  order.deliveryPartner = partner._id;
  if (order.status === 'confirmed' || order.status === 'preparing') {
    order.addTrackingEvent('out_for_delivery', 'Assigned to delivery partner', req.user._id);
  }
  if (order.status === 'out_for_delivery') ensureOtp(order);
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Delivery partner assigned', data: { order: order.toJSON() } });
};

export const refundOrder = async (req, res) => {
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  order.addTrackingEvent('refunded', req.body.reason || 'Refund processed', req.user._id);
  order.setAllItemsStatus('refunded');
  order.syncStatusFromItems();
  order.payment.status = 'refunded';
  await order.save();
  for (const item of order.items) {
    await Food.updateOne({ _id: item.food }, { $inc: { stock: item.quantity } });
  }
  return res.status(200).json({ success: true, status: 200, message: 'Refund processed', data: { order: order.toJSON() } });
};



// ============ DELIVERY PARTNER ============

/** Orders a delivery partner can see/track. Shows all orders so a newly placed
 *  customer order appears instantly with its live status (pending → confirmed
 *  → preparing → out_for_delivery → delivered). */
export const getAssignedDeliveries = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  } else {
    filter.status = { $nin: ['delivered', 'cancelled', 'refunded'] };
  }
  let q = Order.find(filter).sort({ createdAt: -1 }).populate('user', 'name phone');
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

/** Delivery partner updates status (pending->confirmed->preparing->out_for_delivery->delivered).
 *  Accepting an unassigned order assigns it to this partner automatically. */
export const updateDeliveryStatus = async (req, res) => {
  const { status, message, location } = req.body;
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');

  if (order.deliveryPartner && String(order.deliveryPartner) !== String(req.user._id)) {
    throw new ForbiddenError('This order is already assigned to another partner');
  }
  const isNewAssignment = !order.deliveryPartner;
  if (isNewAssignment) order.deliveryPartner = req.user._id;

  // Delivery acts on the whole order, so advance every item with it, otherwise
  // per-item syncStatusFromItems() would demote the order back down.
  order.setAllItemsStatus(status);
  order.addTrackingEvent(status, message || `Delivery status: ${status}`, req.user._id, location || null);
  order.syncStatusFromItems();
  if (order.status === 'out_for_delivery') ensureOtp(order);

  if (status === 'delivered') {
    // Award earnings (delivery charge as commission baseline)
    const earnings = Math.max(10, Math.round(order.deliveryCharge * 0.8));
    const partner = await User.findById(req.user._id);
    partner.deliveryProfile.totalEarnings += earnings;
    partner.deliveryProfile.totalDeliveries += 1;
    await partner.save();
  }
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Status updated', data: { order: order.toJSON() } });
};

/** Delivery partner verifies OTP to complete delivery. */
export const verifyDeliveryOtp = async (req, res) => {
  const { otp } = req.body;
  const order = await findOrderByIdentifier(req.params.id);
  if (!order) throw new NotFoundError('Order not found');
  if (order.deliveryPartner && String(order.deliveryPartner) !== String(req.user._id)) {
    throw new ForbiddenError('This order is already assigned to another partner');
  }
  if (!order.deliveryPartner) order.deliveryPartner = req.user._id;
  if (String(order.deliveryOtp) !== String(otp)) {
    throw new ValidationError('Invalid OTP');
  }
  order.addTrackingEvent('delivered', 'Delivery verified via OTP', req.user._id);
  order.setAllItemsStatus('delivered');
  order.syncStatusFromItems();
  const earnings = Math.max(10, Math.round(order.deliveryCharge * 0.8));
  const partner = await User.findById(req.user._id);
  partner.deliveryProfile.totalEarnings += earnings;
  partner.deliveryProfile.totalDeliveries += 1;
  await partner.save();
  await order.save();
  return res.status(200).json({ success: true, status: 200, message: 'Delivery completed', data: { order: order.toJSON(), earnings } });
};

/** Delivery partner earnings summary. */
export const getDeliveryEarnings = async (req, res) => {
  const partner = await User.findById(req.user._id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysDeliveries = await Order.countDocuments({
    deliveryPartner: req.user._id, status: 'delivered', deliveredAt: { $gte: today },
  });
  const todaysEarnings = await Order.aggregate([
    { $match: { deliveryPartner: partner._id, status: 'delivered', deliveredAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: { $multiply: ['$deliveryCharge', 0.8] } } } },
  ]);
  return res.status(200).json({
    success: true, status: 200,
    data: {
      totalEarnings: partner.deliveryProfile.totalEarnings,
      totalDeliveries: partner.deliveryProfile.totalDeliveries,
      rating: partner.deliveryProfile.rating,
      todaysDeliveries,
      todaysEarnings: round2(todaysEarnings[0]?.total || 0),
    },
  });
};

