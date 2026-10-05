import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as food from '../controllers/foodController.js';
import * as user from '../controllers/userController.js';
import * as admin from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { reviewSchema } from '../validators/adminValidators.js';
import { addressSchema as userAddressSchema } from '../validators/authValidators.js';
import { cachePublic } from '../utils/helpers.js';

const router = Router();

// Public store pin for the delivery map (no secrets). Cached like catalogue.
router.get('/settings/public', cachePublic(60000, 60), asyncHandler(admin.getPublicSettings));

// Public catalog.
//
// These are the highest-traffic reads and the slowest (each costs a cross-region
// Atlas round trip), so they get a short server-side cache + edge/browser
// Cache-Control. The catalogue only changes when an admin edits it, so a 30s
// window is invisible to users and removes the ~500ms wait on every navigation.
router.get('/home', cachePublic(30000, 30), asyncHandler(food.getHome));
router.get('/featured', cachePublic(30000, 30), asyncHandler(food.getFeatured));
router.get('/categories', cachePublic(60000, 60), asyncHandler(food.getCategories));
router.get('/foods', cachePublic(30000, 30), asyncHandler(food.getFoods));
router.get('/foods/:slug', cachePublic(60000, 60), asyncHandler(food.getFoodBySlug));
router.get('/reviews/:foodId', cachePublic(30000, 30), asyncHandler(food.getReviews));

// Authenticated: reviews + wishlist + addresses
// NOTE: `protect` is applied per-route rather than via `router.use(protect)`.
// A router-level middleware also runs for UNMATCHED paths, so any typo'd URL
// (e.g. /api/banners) fell through to `protect` and returned 401 instead of
// the correct 404.

router.post('/reviews', protect, validate(reviewSchema), asyncHandler(food.addReview));
router.post('/reviews/:id/helpful', protect, asyncHandler(food.markReviewHelpful));

router.get('/wishlist', protect, asyncHandler(user.getWishlist));
router.post('/wishlist/:foodId', protect, asyncHandler(user.toggleWishlist));

router.get('/addresses', protect, asyncHandler(user.getAddresses));
router.post('/addresses', protect, validate(userAddressSchema), asyncHandler(user.addAddress));
router.patch('/addresses/:id', protect, validate(userAddressSchema.partial()), asyncHandler(user.updateAddress));
router.delete('/addresses/:id', protect, asyncHandler(user.deleteAddress));
router.patch('/addresses/:id/default', protect, asyncHandler(user.setDefaultAddress));

export default router;
