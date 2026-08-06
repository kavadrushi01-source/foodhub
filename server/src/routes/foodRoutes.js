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
router.use(protect);

router.post('/reviews', validate(reviewSchema), asyncHandler(food.addReview));
router.post('/reviews/:id/helpful', asyncHandler(food.markReviewHelpful));

router.get('/wishlist', asyncHandler(user.getWishlist));
router.post('/wishlist/:foodId', asyncHandler(user.toggleWishlist));

router.get('/addresses', asyncHandler(user.getAddresses));
router.post('/addresses', validate(userAddressSchema), asyncHandler(user.addAddress));
router.patch('/addresses/:id', validate(userAddressSchema.partial()), asyncHandler(user.updateAddress));
router.delete('/addresses/:id', asyncHandler(user.deleteAddress));
router.patch('/addresses/:id/default', asyncHandler(user.setDefaultAddress));

export default router;
