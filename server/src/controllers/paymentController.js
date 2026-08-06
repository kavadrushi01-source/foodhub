import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import config from '../config/index.js';
import {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpaySignature,
} from '../services/razorpayService.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

/** Resolve an order that belongs to the requesting user (admin may manage all). */
const findOwnOrder = async (req, orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ForbiddenError('Not allowed');
  }
  return order;
};

/**
 * Which payment methods are currently available, driven by admin settings and
 * whether Razorpay credentials are configured on the server.
 */
export const getPaymentConfig = async (_req, res) => {
  const settings = await Settings.getSettings();
  const online = settings.features.razorpayEnabled && isRazorpayConfigured();
  const methods = [];
  if (settings.features.codEnabled) methods.push('cod');
  if (online) methods.push('upi', 'razorpay');
  return res.status(200).json({
    success: true, status: 200,
    data: {
      codEnabled: settings.features.codEnabled,
      razorpayConfigured: isRazorpayConfigured(),
      razorpayEnabled: online,
      methods,
      currency: settings.currency || 'INR',
      currencySymbol: settings.currencySymbol || '₹',
    },
  });
};

/**
 * Create a Razorpay Order for an already-created FoodHub order.
 * Returns everything the client's Razorpay Checkout needs to open the modal.
 */
export const createRzpOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await findOwnOrder(req, orderId);

  if (!isRazorpayConfigured()) {
    throw new ValidationError('Online payments are not configured on the server yet');
  }
  if (order.payment.status === 'paid') {
    return res.status(200).json({
      success: true, status: 200, message: 'Order already paid',
      data: { orderId: String(order._id) },
    });
  }

  // Amount is taken from the stored order, never from the client.
  const rzpOrder = await createRazorpayOrder({
    amount: order.grandTotal,
    receipt: order.orderNumber,
    notes: { orderId: String(order._id), orderNumber: order.orderNumber, email: order.address?.phone || '' },
  });
  if (!rzpOrder) {
    throw new ValidationError('Unable to contact payment gateway. Please try again.');
  }

  // Persist the gateway order id so verification can be matched server-side.
  order.payment.transactionId = rzpOrder.id;
  order.payment.gatewayResponse = {
    ...order.payment.gatewayResponse,
    gateway: 'razorpay',
    razorpayOrderId: rzpOrder.id,
    razorpayPaymentId: '',
  };
  await order.save();

  return res.status(201).json({
    success: true, status: 201,
    data: {
      keyId: config.payments.razorpayKeyId,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount, // paise
      currency: rzpOrder.currency,
      internalOrderId: String(order._id),
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || '',
    },
  });
};

/**
 * Verify the Razorpay payment signature and mark the order paid.
 * An order can only be marked paid when the gateway signature is valid.
 */
export const verifyRzpPayment = async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await findOwnOrder(req, orderId);

  if (order.payment.status === 'paid') {
    throw new ValidationError('Order is already paid');
  }
  const stored = order.payment.gatewayResponse?.razorpayOrderId;
  if (!stored || stored !== razorpayOrderId) {
    throw new ValidationError('Payment verification failed: order mismatch');
  }
  if (!verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
    order.payment.status = 'failed';
    order.payment.gatewayResponse = { ...order.payment.gatewayResponse, razorpayPaymentId };
    await order.save();
    throw new ValidationError('Payment verification failed. Please retry or contact support.');
  }

  order.payment.status = 'paid';
  order.payment.transactionId = razorpayPaymentId;
  order.payment.paidAt = new Date();
  order.payment.gatewayResponse = {
    ...order.payment.gatewayResponse,
    razorpayPaymentId,
    razorpaySignature,
  };
  await order.save();

  return res.status(200).json({
    success: true, status: 200, message: 'Payment successful',
    data: { order: order.toJSON() },
  });
};
