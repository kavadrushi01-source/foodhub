import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

/** Build token payload for a user (minimal, no PII). */
export const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

export const getAuthTokens = (user) => {
  const payload = buildTokenPayload(user);
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export default { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, getAuthTokens };
