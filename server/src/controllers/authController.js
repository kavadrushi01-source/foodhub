import User from '../models/User.js';
import { getAuthTokens, buildTokenPayload, signAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import config from '../config/index.js';

const buildVerifyUrl = (token) => `${config.clientUrl}/verify-email?token=${token}`;
const buildResetUrl = (token) => `${config.clientUrl}/reset-password?token=${token}`;
const sha256 = async (token) => (await import('crypto')).createHash('sha256').update(token).digest('hex');

export const register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ConflictError('An account with this email already exists');
  const user = await User.create({ name, email, password, phone, role });
  const rawToken = user.setEmailVerificationToken();
  await user.save();
  await sendVerificationEmail(user.email, buildVerifyUrl(rawToken));
  const tokens = getAuthTokens(user);
  setAuthCookies(res, tokens);
  return res.status(201).json({
    success: true, status: 201,
    message: 'Account created. Please verify your email.',
    data: { user: user.toJSON(), tokens },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Account is disabled. Contact support.');
  const match = await user.comparePassword(password);
  if (!match) throw new UnauthorizedError('Invalid email or password');
  user.lastLogin = new Date();
  await user.save();
  const tokens = getAuthTokens(user);
  setAuthCookies(res, tokens);
  return res.status(200).json({
    success: true, status: 200, message: 'Logged in successfully',
    data: { user: user.toJSON(), tokens },
  });
};

export const logout = async (req, res) => {
  clearAuthCookies(res);
  return res.status(200).json({ success: true, status: 200, message: 'Logged out successfully' });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new UnauthorizedError('Refresh token required');
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) throw new UnauthorizedError('Account not found or disabled');
  const accessToken = signAccessToken(buildTokenPayload(user));
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res.status(200).json({ success: true, status: 200, message: 'Token refreshed', data: { accessToken } });
};

export const me = async (req, res) => {
  return res.status(200).json({ success: true, status: 200, data: { user: req.user.toJSON() } });
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError('No account found with that email');
  if (user.isEmailVerified) throw new AppError('Email is already verified', 400, 'ALREADY_VERIFIED');
  const rawToken = user.setEmailVerificationToken();
  await user.save();
  await sendVerificationEmail(user.email, buildVerifyUrl(rawToken));
  return res.status(200).json({ success: true, status: 200, message: 'Verification email sent' });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  const hashed = await sha256(token);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  });
  if (!user) throw new UnauthorizedError('Invalid or expired verification token');
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Email verified successfully', data: { user: user.toJSON() } });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ success: true, status: 200, message: 'If an account exists, a reset link has been sent.' });
  }
  const rawToken = user.setPasswordResetToken();
  await user.save();
  await sendPasswordResetEmail(user.email, buildResetUrl(rawToken));
  return res.status(200).json({ success: true, status: 200, message: 'If an account exists, a reset link has been sent.' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const hashed = await sha256(token);
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } });
  if (!user) throw new UnauthorizedError('Invalid or expired reset token');
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Password reset successfully. Please log in.' });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ValidationError('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Password updated successfully' });
};

export const updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Profile updated', data: { user: user.toJSON() } });
};

