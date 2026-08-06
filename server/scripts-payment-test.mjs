import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from './src/models/Order.js';
import Food from './src/models/Food.js';
import config from './src/config/index.js';
import { verifyRazorpaySignature } from './src/services/razorpayService.js';

const BASE = 'http://localhost:5000/api';
const DB = process.env.MONGODB_URI;
let passed = 0;
let failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✅ ${name} ${extra}`); }
  else { failed++; console.log(`  ❌ ${name} ${extra}`); }
};

const req = async (method, path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

await mongoose.connect(DB);

// Use the seeded customer account
const login = await req('POST', '/auth/login', { email: 'user@foodhub.com', password: 'User@123' });
check('seeded user login', login.status === 200);
const token = login.data.data.tokens.accessToken;
const userName = login.data.data.user.name;

try {
  // 1. Payment config when Razorpay is NOT configured
  let r = await req('GET', '/payments/config', null, token);
  check('GET /payments/config', r.status === 200);
  check('  razorpayConfigured = false', r.data.data.razorpayConfigured === false);
  check('  methods fall back to COD only', Array.isArray(r.data.data.methods) && r.data.data.methods.length === 1 && r.data.data.methods[0] === 'cod');

  // 2. Online order rejected cleanly when not configured
  const food = await Food.findOne({ stock: { $gte: 1 } }).sort({ stock: -1 });
  const foodId = food._id.toString();
  // Ensure an address exists for the seeded user
  let addrRes = await req('GET', '/addresses', null, token);
  let address = addrRes.data.data?.addresses?.[0];
  if (!address) {
    const created = await req('POST', '/addresses', { label: 'Home', line1: 'Test Street 10', city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9876543210' }, token);
    address = created.data.data?.addresses?.at(-1);
  }
  const basePayload = {
    items: [{ food: foodId, quantity: 1 }],
    paymentMethod: 'upi',
  };
  r = await req('POST', '/orders', { ...basePayload, addressId: address?._id }, token);
  check('createOrder upi when not configured -> 400', r.status === 400 && /Online payments/.test(r.data.message));

  // 3. UPI is a valid model enum value (the latent bug that used to break saving)
  const testOrder = new Order({
    user: login.data.data.user._id,
    items: [{ food: foodId, quantity: 1, name: 'Test', price: 10, lineTotal: 10 }],
    address: { line1: 'Test St', city: 'Mumbai', state: 'MH', pincode: '400001' },
    subTotal: 10, deliveryCharge: 0, packagingCharge: 0, tax: 0, discount: 0, grandTotal: 10,
    payment: { method: 'upi', status: 'pending', gatewayResponse: { gateway: 'razorpay' } },
    status: 'pending',
  });
  await testOrder.save();
  check('Order model accepts payment.method=upi', true);
  await Order.deleteOne({ _id: testOrder._id });

  // 4. Razorpay signature verification algorithm (valid + tampered)
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_abc123';
  delete process.env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_xyz';
  // config already loaded from .env (empty), so reload the values it reads
  config.payments.razorpayKeySecret = 'rzp_test_secret_abc123';
  const oid = 'order_OQXYZ123456';
  const pid = 'pay_OQXYZ123456';
  const goodSig = crypto.createHmac('sha256', 'rzp_test_secret_abc123').update(`${oid}|${pid}`).digest('hex');
  check('signature verifies (valid)', verifyRazorpaySignature({ orderId: oid, paymentId: pid, signature: goodSig }) === true);
  check('signature rejects tampered', verifyRazorpaySignature({ orderId: oid, paymentId: pid, signature: 'deadbeefdeadbeef' }) === false);
  check('signature rejects missing fields', verifyRazorpaySignature({ orderId: '', paymentId: '', signature: '' }) === false);
} catch (err) {
  console.error('SCRIPT ERROR:', err);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
await mongoose.disconnect();
process.exit(failed ? 1 : 0);
