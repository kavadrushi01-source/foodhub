import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as food from '../controllers/foodController.js';
import * as user from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { reviewSchema } from '../validators/adminValidators.js';
import { addressSchema as userAddressSchema } from '../validators/authValidators.js';

const router = Router();

// Public catalog
router.get('/featured', asyncHandler(food.getFeatured));
router.get('/categories', asyncHandler(food.getCategories));
router.get('/foods', asyncHandler(food.getFoods));
router.get('/foods/:slug', asyncHandler(food.getFoodBySlug));
router.get('/reviews/:foodId', asyncHandler(food.getReviews));

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
