import crypto from 'crypto';
import Razorpay from 'razorpay';
import config from '../config/index.js';

let instance = null;

/** True only when both Razorpay credentials are set in the environment. */
export const isRazorpayConfigured = () =>
  Boolean(config.payments.razorpayKeyId && config.payments.razorpayKeySecret);

/** Lazily created singleton Razorpay client (null when not configured). */
const getClient = () => {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: config.payments.razorpayKeyId,
      key_secret: config.payments.razorpayKeySecret,
    });
  }
  return instance;
};

/**
 * Create a Razorpay Order for a given amount (in rupees).
 * Returns the gateway order object, or null when Razorpay is not configured.
 */
export const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  const client = getClient();
  if (!client) return null;
  const order = await client.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: String(receipt || '').slice(0, 40),
    notes: notes || {},
    payment_capture: 1,
  });
  return order;
};

/**
 * Verify a Razorpay payment signature (HMAC-SHA256 of
 * `${order_id}|${payment_id}` using the key secret).
 * Constant-time comparison guards against timing attacks.
 */
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature || !config.payments.razorpayKeySecret) return false;
  const expected = crypto
    .createHmac('sha256', config.payments.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const received = String(signature);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
};

export default { isRazorpayConfigured, createRazorpayOrder, verifyRazorpaySignature };
