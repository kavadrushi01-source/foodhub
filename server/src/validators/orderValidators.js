import { z } from 'zod';

export const applyCouponSchema = z.object({
  code: z.string().trim().min(2).max(30),
  subTotal: z.number().min(0),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        food: z.string().min(1, 'Food ID is required'),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, 'Cart is empty'),
  addressId: z.string().min(1, 'Delivery address is required').optional(),
  address: z
    .object({
      label: z.string().optional(),
      line1: z.string().min(3),
      line2: z.string().optional().default(''),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().min(3),
      phone: z.string().optional().default(''),
      location: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
    })
    .optional(),
  paymentMethod: z.enum(['cod', 'razorpay', 'stripe', 'upi']).default('cod'),
  couponCode: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional().default(''),
  scheduleFor: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  message: z.string().trim().max(300).optional().default(''),
  location: z.object({ lat: z.number().optional(), lng: z.number().optional() }).optional(),
});

export const assignDeliverySchema = z.object({
  deliveryPartnerId: z.string().min(1, 'Delivery partner ID is required'),
});

export const verifyOtpSchema = z.object({
  otp: z.string().min(4, 'OTP is required').max(8),
});

export const updateItemStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
});
