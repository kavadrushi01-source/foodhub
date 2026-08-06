import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as payment from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createRzpOrderSchema, verifyRzpPaymentSchema } from '../validators/paymentValidators.js';

const router = Router();

router.use(protect); // all payment routes require auth

router.get('/config', asyncHandler(payment.getPaymentConfig));
router.post('/order', validate(createRzpOrderSchema), asyncHandler(payment.createRzpOrder));
router.post('/verify', validate(verifyRzpPaymentSchema), asyncHandler(payment.verifyRzpPayment));

export default router;
