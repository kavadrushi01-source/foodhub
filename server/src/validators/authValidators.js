import { z } from 'zod';

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: passwordRules,
  phone: z.string().trim().optional().default(''),
  role: z.enum(['user', 'delivery']).optional().default('user'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(8, 'Token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8, 'Token is required'),
  password: passwordRules,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordRules,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().max(20).optional(),
  avatar: z.string().trim().optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default('Home'),
  line1: z.string().trim().min(3, 'Address line is required').max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().min(3).max(12),
  phone: z.string().trim().max(20).optional().default(''),
  isDefault: z.boolean().optional().default(false),
  location: z
    .object({ lat: z.number().optional(), lng: z.number().optional() })
    .optional(),
});
