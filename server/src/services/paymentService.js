import crypto from 'crypto';
import Razorpay from 'razorpay';
import config from '../config/index.js';
import logger from '../config/logger.js';

let instance = null;

/** Validate a payment signature using constant-time comparison (HMAC-SHA256). */
const safeEqual = (a, b) => {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

// Reasonable number of paise per currency (Razorpay only accepts INR here).
const toPaise = (amount) => Math.round(Number(amount) * 100);

export const razorpayEnabled = () => config.payments.razorpayEnabled;

const getInstance = () => {
  if (!config.payments.razorpayEnabled) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: config.payments.razorpayKeyId,
      key_secret: config.payments.razorpayKeySecret,
    });
  }
  return instance;
};

/**
 * Create a Razorpay order for a given amount (in rupees/currency units).
 * Returns the order object returned by Razorpay (with `id` = order_id).
 */
export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt = '', notes = {} }) => {
  const rp = getInstance();
  if (!rp) {
    const err = new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    err.statusCode = 503;
    err.code = 'PAYMENT_NOT_CONFIGURED';
    throw err;
  }
  try {
    return await rp.orders.create({
      amount: toPaise(amount),
      currency,
      receipt: String(receipt).slice(0, 40),
      notes,
    });
  } catch (err) {
    logger.error('Razorpay order creation failed:', err.message);
    const e = new Error('Unable to initialize payment. Please try again or use COD.');
    e.statusCode = 502;
    e.code = 'PAYMENT_INIT_FAILED';
    throw e;
  }
};

/**
 * Verify a Razorpay payment webhook/checkout signature.
 * Known signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret) in hex.
 */
export const verifyRazorpaySignature = ({ order_id, payment_id }, signature) => {
  if (!order_id || !payment_id || !signature) return false;
  const expected = crypto
    .createHmac('sha256', config.payments.razorpayKeySecret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');
  return safeEqual(expected, signature);
};

export default {
  razorpayEnabled,
  createRazorpayOrder,
  verifyRazorpaySignature,
};