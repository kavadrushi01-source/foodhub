import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../config/logger.js';

// The Razorpay SDK (~1MB with deps) is intentionally NOT imported at module
// scope: that cost would land on EVERY cold start, including reads that never
// touch payments. It is dynamically imported only when a test-mode order is
// actually being created.
let instance = null;
let RazorpayCtor = null;

const loadSdk = async () => {
  if (!RazorpayCtor) {
    const mod = await import('razorpay');
    RazorpayCtor = mod.default || mod;
  }
  return RazorpayCtor;
};

/**
 * True only when a valid RAZORPAY *TEST* key pair is configured.
 *
 * Deliberately returns false for live keys: this project runs Razorpay in test
 * mode only, so a live key must never enable real charging. The mode is derived
 * from the key prefix in config (`rzp_test_` vs `rzp_live_`).
 */
export const isRazorpayConfigured = () => config.payments.razorpayEnabled;

/** 'test' | 'live' | 'unknown' | 'none' — from the key prefix. */
export const getRazorpayMode = () => config.payments.razorpayKeyMode;

// Warn once per instance when a live key was supplied and refused, so a
// misconfigured deploy is visible in the logs instead of failing silently.
if (config.payments.razorpayLiveBlocked) {
  logger.warn(
    'Razorpay LIVE key detected and BLOCKED — this project is test-mode only. ' +
      'Set RAZORPAY_KEY_ID to an rzp_test_… key. Online payments stay disabled.',
  );
}

/** Lazily created singleton Razorpay client (null unless test keys are set). */
const getClient = async () => {
  if (!isRazorpayConfigured()) return null;
  if (!instance) {
    const Razorpay = await loadSdk();
    instance = new Razorpay({
      key_id: config.payments.razorpayKeyId,
      key_secret: config.payments.razorpayKeySecret,
    });
  }
  return instance;
};

/**
 * Create a Razorpay Order for a given amount (in rupees).
 * Returns the gateway order object, or null when test mode is not configured.
 */
export const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  const client = await getClient();
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
 *
 * Refuses to verify anything when test mode is not configured, so a live secret
 * can never be used to validate a payment.
 */
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!isRazorpayConfigured()) return false;
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', config.payments.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const received = String(signature);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
};

export default {
  isRazorpayConfigured,
  getRazorpayMode,
  createRazorpayOrder,
  verifyRazorpaySignature,
};
