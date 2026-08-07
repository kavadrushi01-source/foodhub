import { Router } from 'express';
import passport from '../config/oauth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as auth from '../controllers/authController.js';
import * as oauth from '../controllers/oauthController.js';
import validate from '../middlewares/validate.js';
import {
  registerSchema, loginSchema, resendVerificationSchema, verifyEmailSchema,
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema, addressSchema,
} from '../validators/authValidators.js';
import { protect } from '../middlewares/auth.js';
import { oauthEnabled } from '../config/oauth.js';

const router = Router();

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

const socialRoute = (provider) => (req, res, next) => {
  if (!oauthEnabled[provider]) {
    return res.status(503).json({
      success: false, status: 503, code: 'OAUTH_NOT_CONFIGURED',
      message: 'This sign in method is not configured on the server yet.',
    });
  }
  return next();
};

router.get(
  '/google',
  socialRoute('google'),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);
router.get(
  '/google/callback',
  socialRoute('google'),
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?error=Authentication%20failed` }),
  oauth.handleOAuthCallback('google'),
);

router.use(protect); // everything below requires auth
router.post('/change-password', validate(changePasswordSchema), asyncHandler(auth.changePassword));
router.patch('/profile', validate(updateProfileSchema), asyncHandler(auth.updateProfile));

export default router;
