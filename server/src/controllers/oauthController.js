import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config/index.js';
import { oauthEnabled, profileToUser } from '../config/oauth.js';
import { getAuthTokens } from '../utils/jwt.js';
import { setAuthCookies } from '../utils/cookie.js';
import logger from '../config/logger.js';

// One-time handoff codes are single-use to stop replay of a leaked URL.
const usedHandoffs = new Set();
const HANDOFF_TTL = 5 * 60 * 1000;

const createHandoff = (user) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ sub: user._id.toString(), typ: 'oauth-handoff', nonce }, config.jwt.refreshSecret, { expiresIn: '5m' });
};

/**
 * Find an existing account by provider id, else by email (linking the provider
 * to an existing local account), else create a new account.
 */
const findOrCreateUser = async (provider, data) => {
  const { providerId, email, name, avatar } = data;
  const providerField = provider === 'google' ? 'googleId' : 'facebookId';

  const byProvider = await User.findOne({ [providerField]: providerId });
  if (byProvider) return byProvider;

  const byEmail = await User.findOne({ email });
  if (byEmail) {
    byEmail[providerField] = providerId;
    byEmail.provider = byEmail.provider === 'local' ? provider : byEmail.provider;
    if (!byEmail.avatar && avatar) byEmail.avatar = avatar;
    byEmail.isEmailVerified = true;
    await byEmail.save();
    return byEmail;
  }

  return User.create({
    name,
    email,
    password: crypto.randomBytes(24).toString('hex'), // never used, only enables the required field
    avatar,
    provider,
    [providerField]: providerId,
    isEmailVerified: true,
  });
};

/** Redirect to the client app with a one-time handoff code (tokens never touch the URL). */
export const handleOAuthCallback = (provider) => async (req, res) => {
  try {
    const profile = req.user;
    if (!profile) {
      return res.redirect(`${config.clientUrl}/oauth-callback?error=${encodeURIComponent('Authentication failed')}`);
    }

    const data = profileToUser(provider, profile);
    if (!data) {
      return res.redirect(`${config.clientUrl}/oauth-callback?error=${encodeURIComponent('No email returned by the provider. Please use email/password instead.')}`);
    }

    const user = await findOrCreateUser(provider, data);
    if (!user.isActive) {
      return res.redirect(`${config.clientUrl}/oauth-callback?error=${encodeURIComponent('Account is disabled. Contact support.')}`);
    }

    user.lastLogin = new Date();
    await user.save();

    const handoff = createHandoff(user);
    return res.redirect(`${config.clientUrl}/oauth-callback?code=${handoff}`);
  } catch (err) {
    logger.error(`OAuth ${provider} callback failed:`, err.message);
    return res.redirect(`${config.clientUrl}/oauth-callback?error=${encodeURIComponent('Something went wrong during sign in. Please try again.')}`);
  }
};

/** Which social providers are configured and ready to use. */
export const providers = async (_req, res) => {
  res.status(200).json({ success: true, status: 200, data: oauthEnabled });
};

/** Exchange a one-time handoff code for real JWT tokens. */
export const exchange = async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, status: 400, message: 'Handoff code is required' });
  }

  let payload;
  try {
    payload = jwt.verify(code, config.jwt.refreshSecret);
  } catch {
    return res.status(400).json({ success: false, status: 400, message: 'Invalid or expired sign-in link' });
  }
  if (payload.typ !== 'oauth-handoff') {
    return res.status(400).json({ success: false, status: 400, message: 'Invalid sign-in link' });
  }
  if (usedHandoffs.has(payload.nonce)) {
    return res.status(400).json({ success: false, status: 400, message: 'This sign-in link has already been used' });
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, status: 401, message: 'Account not found or disabled' });
  }

  usedHandoffs.add(payload.nonce);
  setTimeout(() => usedHandoffs.delete(payload.nonce), HANDOFF_TTL);

  const tokens = getAuthTokens(user);
  setAuthCookies(res, tokens);
  return res.status(200).json({
    success: true, status: 200, message: 'Signed in successfully',
    data: { user: user.toJSON(), tokens },
  });
};
