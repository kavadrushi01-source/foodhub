import crypto from 'crypto';

/**
 * Generate a short random token (for email verification, password reset, OTP).
 * @param {number} length - byte length
 * @param {'hex'|'base64'} encoding
 */
export const generateToken = (length = 32, encoding = 'hex') =>
  crypto.randomBytes(length).toString(encoding);

/** Generate a numeric OTP of given digits (default 6). */
export const generateOtp = (digits = 6) => {
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  return String(crypto.randomInt(min, max));
};

/** Hash a token using SHA-256 (used to store verification tokens securely). */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export default { generateToken, generateOtp, hashToken };
