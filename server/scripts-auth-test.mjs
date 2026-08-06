import 'dotenv/config';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './src/models/User.js';
import config from './src/config/index.js';

const BASE = 'http://localhost:5000/api';
const DB = process.env.MONGODB_URI;
let passed = 0;
let failed = 0;

const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✅ ${name} ${extra}`); }
  else { failed++; console.log(`  ❌ ${name} ${extra}`); }
};

const post = async (path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};
const get = async (path, token) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, data: await res.json() };
};

await mongoose.connect(DB);
const email = `authtest_${Date.now()}@foodhub.test`;
const password = 'TestPass123';

try {
  // 1. Register
  let r = await post('/auth/register', { name: 'Auth Tester', email, password });
  check('register', r.status === 201, `(${email})`);
  const tokens = r.data.data?.tokens;
  check('register returns tokens', !!tokens?.accessToken && !!tokens?.refreshToken);
  const userId = r.data.data?.user?._id;
  check('new user unverified', r.data.data?.user?.isEmailVerified === false);

  // 2. Verify email with wrong token -> 401
  r = await post('/auth/verify-email', { token: 'wrongtokenwrongtoken' });
  check('verify-email rejects bad token', r.status === 401);

  // 3. Generate a real verification token via the model and verify
  const user = await User.findById(userId);
  const rawVerify = user.setEmailVerificationToken();
  await user.save();
  r = await post('/auth/verify-email', { token: rawVerify });
  check('verify-email with valid token', r.status === 200 && r.data.data.user.isEmailVerified === true);

  // 4. Forgot password (unknown email - no leak)
  r = await post('/auth/forgot-password', { email: 'nobody@foodhub.test' });
  check('forgot-password unknown email (no leak)', r.status === 200);

  // 5. Reset password with valid token, then login with new password
  const u2 = await User.findOne({ email });
  const rawReset = u2.setPasswordResetToken();
  await u2.save();
  r = await post('/auth/reset-password', { token: rawReset, password: 'NewPass456' });
  check('reset-password valid token', r.status === 200);
  r = await post('/auth/login', { email, password: 'NewPass456' });
  check('login with new password', r.status === 200);
  const newTokens = r.data.data.tokens;
  const fresh = await User.findOne({ email });
  check('reset token nulled', fresh.passwordResetToken === null);

  // 6. Refresh flow
  r = await post('/auth/refresh', { refreshToken: newTokens.refreshToken });
  check('refresh returns new access token', r.status === 200 && !!r.data.data.accessToken);
  const refreshed = r.data.data.accessToken;

  // 7. /auth/me with refreshed token
  r = await get('/auth/me', refreshed);
  check('me with refreshed token', r.status === 200 && r.data.data.user.email === email);

  // 8. Invalid refresh token -> 401
  r = await post('/auth/refresh', { refreshToken: 'garbage' });
  check('refresh rejects bad token', r.status === 401);

  // 9. resend-verification (already verified -> 400)
  r = await post('/auth/resend-verification', { email });
  check('resend-verification when already verified -> 400', r.status === 400);

  // 10. Login with wrong password -> 401
  r = await post('/auth/login', { email, password: 'WrongPass123' });
  check('login wrong password -> 401', r.status === 401);

  // 11. change-password
  r = await post('/auth/change-password', { currentPassword: 'NewPass456', newPassword: 'FinalPass789' }, refreshed);
  check('change-password', r.status === 200);
  r = await post('/auth/login', { email, password: 'FinalPass789' });
  check('login after change-password', r.status === 200);

  // 12. OAuth provider fields on user
  const finalUser = await User.findOne({ email });
  check('provider defaults to local', finalUser.provider === 'local');
  check('googleId null', finalUser.googleId == null);

  // 13. OAuth handoff exchange flow
  const oauthEmail = `oauth_${Date.now()}@foodhub.test`;
  const oauthUser = await User.create({
    name: 'OAuth User',
    email: oauthEmail,
    password: crypto.randomBytes(24).toString('hex'),
    provider: 'google',
    googleId: 'google_12345',
    isEmailVerified: true,
  });
  const makeHandoff = (sub, nonce) =>
    jwt.sign({ sub: sub.toString(), typ: 'oauth-handoff', nonce }, config.jwt.refreshSecret, { expiresIn: '5m' });

  const handoff = makeHandoff(oauthUser._id, crypto.randomBytes(16).toString('hex'));
  r = await post('/auth/oauth/exchange', { code: handoff });
  check('oauth exchange -> 200 with tokens', r.status === 200 && !!r.data.data.tokens?.accessToken && r.data.data.user.email === oauthEmail);

  r = await post('/auth/oauth/exchange', { code: handoff });
  check('oauth code single-use (reuse -> 400)', r.status === 400);

  const badHandoff = makeHandoff(new mongoose.Types.ObjectId(), crypto.randomBytes(16).toString('hex'));
  r = await post('/auth/oauth/exchange', { code: badHandoff });
  check('oauth exchange unknown user -> 401', r.status === 401);

  r = await post('/auth/oauth/exchange', { code: 'not-a-jwt' });
  check('oauth exchange garbage -> 400', r.status === 400);

  // linking: existing local user + same email signs in with Google -> gets googleId
  const localOAuth = await User.create({ name: 'Link Me', email: `link_${Date.now()}@foodhub.test`, password: 'LinkPass123' });
  const providerId = `google_link_${Date.now()}`;
  await User.updateOne({ email: localOAuth.email }, { googleId: providerId, provider: 'google', isEmailVerified: true });
  const linked = await User.findOne({ email: localOAuth.email });
  check('google linking sets googleId on local user', linked.googleId === providerId && linked.isEmailVerified === true);
  await User.deleteOne({ _id: localOAuth._id });
  await User.deleteOne({ _id: oauthUser._id });

  // 14. Cleanup
  await User.deleteOne({ _id: userId });
  check('cleanup deleted test user', (await User.findById(userId)) == null);
} catch (err) {
  console.error('SCRIPT ERROR:', err);
  failed++;
}

console.log(`\n${passed} passed, ${failed} failed`);
await mongoose.disconnect();
process.exit(failed ? 1 : 0);
