import mongoose from 'mongoose';
import { generateOtp } from '../utils/token.js';

const ORDER_STATUSES = [
  'pending',         // created, awaiting confirmation
  'confirmed',       // accepted by admin/restaurant
  'preparing',       // being prepared
  'out_for_delivery', // handed to delivery partner
  'delivered',
  'cancelled',
  'refunded',
];

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'cod'];

const ITEM_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
const PIPELINE = { pending: 0, confirmed: 1, preparing: 2, out_for_delivery: 3, delivered: 4, cancelled: 5, refunded: 6 };

const orderItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    isVeg: { type: Boolean, default: true },
    lineTotal: { type: Number, required: true },
    status: { type: String, enum: ITEM_STATUSES, default: 'pending' },
  },
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, default: '' },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['cod', 'razorpay', 'stripe', 'upi'], default: 'cod' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    transactionId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    message: { type: String, default: '' },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    items: [orderItemSchema],
    address: deliveryAddressSchema,

    subTotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    packagingCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    couponCode: { type: String, default: '' },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    payment: { type: paymentSchema, default: () => ({}) },

    deliveryOtp: { type: String, default: '' },
    expectedDeliveryTime: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },

    tracking: [trackingEventSchema],
    notes: { type: String, default: '' },

    invoiceUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

// Generate a human-readable order number on creation
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    const stamp = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `FH${stamp}${rand}`;
  }
  if (!this.deliveryOtp) {
    this.deliveryOtp = generateOtp(4);
  }
  if (!this.expectedDeliveryTime) {
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + 45);
    this.expectedDeliveryTime = eta;
  }
  next();
});

orderSchema.methods.addTrackingEvent = function (status, message = '', by = null, location = null) {
  this.status = status;
  this.tracking.push({ status, message, by, location, at: new Date() });
  if (status === 'delivered') this.deliveredAt = new Date();
  if (status === 'cancelled') this.cancelledAt = new Date();
  return this;
};

/**
 * Derive the order-level status from the statuses of its individual items.
 * The order is only fully "delivered" (or "cancelled"/"refunded") when every
 * item shares that terminal status; otherwise it reflects the least-advanced
 * active item still in the pipeline.
 */
orderSchema.methods.syncStatusFromItems = function () {
  const items = this.items || [];
  if (!items.length) return this;
  const statusOf = (it) => it.status || 'pending';
  const active = items.filter((it) => !['cancelled', 'refunded', 'delivered'].includes(statusOf(it)));

  if (!active.length) {
    if (items.every((it) => statusOf(it) === 'delivered')) this.status = 'delivered';
    else if (items.every((it) => statusOf(it) === 'cancelled')) this.status = 'cancelled';
    else if (items.every((it) => statusOf(it) === 'refunded')) this.status = 'refunded';
    else this.status = items.some((it) => statusOf(it) === 'delivered') ? 'delivered' : this.status;
    if (this.status === 'delivered') this.deliveredAt = this.deliveredAt || new Date();
    if (this.status === 'cancelled') this.cancelledAt = this.cancelledAt || new Date();
    return this;
  }

  const lowest = Math.min(...active.map((it) => PIPELINE[statusOf(it)]));
  this.status = ORDER_STATUSES[lowest];
  return this;
};

orderSchema.methods.setAllItemsStatus = function (status) {
  (this.items || []).forEach((it) => { it.status = status; });
  return this;
};

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.deliveryOtp;
  return obj;
};

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

export const ORDER_STATUS_LIST = ORDER_STATUSES;
export const ITEM_STATUS_LIST = ITEM_STATUSES;
export const PAYMENT_STATUS_LIST = PAYMENT_STATUSES;
export default mongoose.model('Order', orderSchema);
