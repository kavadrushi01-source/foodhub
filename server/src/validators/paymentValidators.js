import { z } from 'zod';

export const createRzpOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const verifyRzpPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  razorpayOrderId: z.string().min(1, 'Gateway order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Gateway payment ID is required'),
  razorpaySignature: z.string().min(1, 'Gateway signature is required'),
});
