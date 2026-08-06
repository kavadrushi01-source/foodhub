import crypto from 'crypto';
import config from './src/config/index.js';
import { isRazorpayConfigured, verifyRazorpaySignature, createRazorpayOrder } from './src/services/razorpayService.js';

let passed = 0;
let failed = 0;
const check = (n, c, x = '') => { c ? passed++ : failed++; console.log(`${c ? '  ✅' : '  ❌'} ${n} ${x}`); };

const SECRET = 'test_secret_xyz';
config.payments.razorpayKeyId = 'rzp_test_key';
config.payments.razorpayKeySecret = SECRET;
check('isRazorpayConfigured true when keys set', isRazorpayConfigured() === true);

const orderId = 'order_Ov1x5abcdef';
const paymentId = 'pay_P1abc12345';
const expected = crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');

check('valid signature accepted', verifyRazorpaySignature({ orderId, paymentId, signature: expected }) === true);
check('tampered paymentId rejected', verifyRazorpaySignature({ orderId, paymentId: 'pay_OTHER', signature: expected }) === false);
check('tampered signature rejected', verifyRazorpaySignature({ orderId, paymentId, signature: expected.slice(0, -2) + 'aa' }) === false);
check('empty signature rejected', verifyRazorpaySignature({ orderId, paymentId, signature: '' }) === false);
check('missing fields rejected', verifyRazorpaySignature({}) === false);

// Not-configured behavior
config.payments.razorpayKeySecret = '';
check('isRazorpayConfigured false without secret', isRazorpayConfigured() === false);
const order = await createRazorpayOrder({ amount: 100, receipt: 'R1' });
check('createRazorpayOrder returns null when not configured', order === null);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);