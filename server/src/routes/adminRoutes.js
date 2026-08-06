import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as admin from '../controllers/adminController.js';
import * as order from '../controllers/orderController.js';
import { protect, adminOnly } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  foodSchema, updateFoodSchema, categorySchema, updateCategorySchema,
  couponSchema, updateCouponSchema,
} from '../validators/adminValidators.js';
import { updateOrderStatusSchema, assignDeliverySchema, updateItemStatusSchema } from '../validators/orderValidators.js';
import { z } from 'zod';

const router = Router();
router.use(protect, adminOnly);

// Dashboard analytics
router.get('/stats', asyncHandler(admin.getDashboardStats));
router.get('/revenue', asyncHandler(admin.getRevenueReport));
router.get('/top-foods', asyncHandler(admin.getTopFoods));
router.get('/category-stats', asyncHandler(admin.getCategoryStats));

// Food CRUD
router.get('/foods', asyncHandler(admin.getFoodsAdmin));
router.post('/foods', validate(foodSchema), asyncHandler(admin.createFood));
router.patch('/foods/:id', validate(updateFoodSchema), asyncHandler(admin.updateFood));
router.delete('/foods/:id', asyncHandler(admin.deleteFood));
router.patch('/foods/:id/stock', validate(z.object({ stock: z.number().int().min(0) })), asyncHandler(admin.updateStock));

// Category CRUD
router.get('/categories', asyncHandler(admin.getCategoriesAdmin));
router.post('/categories', validate(categorySchema), asyncHandler(admin.createCategory));
router.patch('/categories/:id', validate(updateCategorySchema), asyncHandler(admin.updateCategory));
router.delete('/categories/:id', asyncHandler(admin.deleteCategory));

// Coupon CRUD
router.get('/coupons', asyncHandler(admin.getCoupons));
router.post('/coupons', validate(couponSchema), asyncHandler(admin.createCoupon));
router.patch('/coupons/:id', validate(updateCouponSchema), asyncHandler(admin.updateCoupon));
router.delete('/coupons/:id', asyncHandler(admin.deleteCoupon));

// Order management
router.get('/orders', asyncHandler(order.getAllOrders));
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), asyncHandler(order.updateOrderStatus));
router.patch('/orders/:id/items/:itemId/status', validate(updateItemStatusSchema), asyncHandler(order.updateItemStatus));
router.post('/orders/:id/assign', validate(assignDeliverySchema), asyncHandler(order.assignDelivery));
router.post('/orders/:id/refund', asyncHandler(order.refundOrder));

// User / role management
router.get('/users', asyncHandler(admin.getUsers));
router.patch('/users/:id/role', validate(z.object({ role: z.enum(['user', 'admin', 'delivery']) })), asyncHandler(admin.updateUserRole));
router.patch('/users/:id/toggle-active', asyncHandler(admin.toggleUserActive));

// Review management
router.get('/reviews', asyncHandler(admin.getReviewsAdmin));
router.delete('/reviews/:id', asyncHandler(admin.deleteReview));

// Settings
router.get('/settings', asyncHandler(admin.getSettings));
router.patch('/settings', asyncHandler(admin.updateSettings));

export default router;
