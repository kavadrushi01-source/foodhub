import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as order from '../controllers/orderController.js';
import { protect, deliveryOnly } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { updateOrderStatusSchema, verifyOtpSchema } from '../validators/orderValidators.js';

const router = Router();
router.use(protect, deliveryOnly);

router.get('/deliveries', asyncHandler(order.getAssignedDeliveries));
router.get('/earnings', asyncHandler(order.getDeliveryEarnings));
router.get('/orders/:id', asyncHandler(order.getOrderForUser));
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), asyncHandler(order.updateDeliveryStatus));
router.post('/orders/:id/verify-otp', validate(verifyOtpSchema), asyncHandler(order.verifyDeliveryOtp));

export default router;
