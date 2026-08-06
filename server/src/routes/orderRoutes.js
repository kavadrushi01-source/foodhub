import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as order from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  checkoutSchema, applyCouponSchema, updateOrderStatusSchema, assignDeliverySchema, verifyOtpSchema,
} from '../validators/orderValidators.js';

const router = Router();

router.use(protect); // all order routes require auth

// Preview & coupon
router.post('/preview', validate(checkoutSchema), asyncHandler(order.previewCheckout));
router.post('/coupon/apply', validate(applyCouponSchema), asyncHandler(order.applyCoupon));

// Create + confirm payment
router.post('/', validate(checkoutSchema), asyncHandler(order.createOrder));
router.post('/:id/payment/confirm', asyncHandler(order.confirmPayment));

// User order history + detail + cancel
router.get('/me', asyncHandler(order.getMyOrders));
router.get('/:id', asyncHandler(order.getOrderForUser));
router.post('/:id/cancel', asyncHandler(order.cancelOrder));

export default router;
