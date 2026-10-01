import { Router } from 'express';
import passport from '../config/oauth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../controllers/authController.js';
import * as oauth from '../controllers/oauthController.js';
import validate from '../middlewares/validate.js';
import config from '../config/index.js';
import {
  registerSchema, loginSchema, resendVerificationSchema, verifyEmailSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema, addressSchema,
} from '../validators/authValidators.js';
import { protect } from '../middlewares/auth.js';
import { oauthEnabled } from '../config/oauth.js';

const router = Router();

// config.clientUrl is already the single canonical frontend origin (the
// comma-separated CLIENT_URL allow-list is parsed in config/index.js).
const clientHome = config.clientUrl;
const oauthFailureRedirect = `${clientHome}/oauth-callback?error=${encodeURIComponent('Sign-in failed. Please try again.')}`;

router.post('/register', validate(registerSchema), asyncHandler(auth.register));
router.post('/login', validate(loginSchema), asyncHandler(auth.login));
router.post('/logout', asyncHandler(auth.logout));
router.post('/refresh', asyncHandler(auth.refresh));
router.get('/me', protect, asyncHandler(auth.me));

router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(auth.verifyEmail));
router.post('/resend-verification', validate(resendVerificationSchema), asyncHandler(auth.resendVerification));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(auth.forgotPassword));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(auth.resetPassword));

// ============ SOCIAL AUTH (Google) ============
router.get('/providers', asyncHandler(oauth.providers));
router.post('/oauth/exchange', asyncHandler(oauth.exchange));

// The client navigates here with a plain <a href>, so a JSON body would render
// as raw text in the browser. Redirect back to the login page with a readable
// message instead of dumping an error payload on screen.
const socialRoute = (provider) => (req, res, next) => {
  if (!oauthEnabled[provider]) {
    return res.redirect(
      `${clientHome}/oauth-callback?error=${encodeURIComponent('Google sign-in is not available right now. Please use email and password.')}`,
    );
  }
  return next();
};

router.get(
  '/google',
  socialRoute('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
// NOTE: failureRedirect previously used `process.env.CLIENT_URL` directly. That
// variable is a comma-separated allow-list, so with more than one entry it
// produced a malformed Location (e.g. "https://a,https://b/oauth-callback").
// `oauthFailureRedirect` is built from the parsed single origin instead.
router.get(
  '/google/callback',
  socialRoute('google'),
  passport.authenticate('google', { session: false, failureRedirect: oauthFailureRedirect }),
  oauth.handleOAuthCallback('google'),
);

// Applied per-route (not via `router.use(protect)`) so unknown /api/auth/*
// paths return 404 instead of 401.
router.post('/change-password', protect, validate(changePasswordSchema), asyncHandler(auth.changePassword));
router.patch('/profile', protect, validate(updateProfileSchema), asyncHandler(auth.updateProfile));

export default router;
