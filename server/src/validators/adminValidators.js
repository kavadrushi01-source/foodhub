import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(240).optional().default(''),
  image: z.string().trim().optional().default(''),
  icon: z.string().trim().max(10).optional().default('🍽️'),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const updateCategorySchema = categorySchema.partial();

export const foodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().min(10).max(2000),
  shortDescription: z.string().trim().max(160).optional().default(''),
  category: z.string().min(1, 'Category is required'),
  cuisine: z.string().trim().max(60).optional().default('Indian'),
  tags: z.array(z.string().trim()).optional().default([]),
  price: z.number().min(0),
  discountPrice: z.number().min(0).nullable().optional(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  primaryImage: z.string().optional().default(''),
  ingredients: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  nutrition: z
    .object({
      calories: z.number().optional().default(0),
      protein: z.number().optional().default(0),
      carbs: z.number().optional().default(0),
      fat: z.number().optional().default(0),
      fiber: z.number().optional().default(0),
      servingSize: z.string().optional().default('1 serving'),
    })
    .optional()
    .default({}),
  isVeg: z.boolean().optional().default(true),
  isSpicy: z.boolean().optional().default(false),
  isBestseller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  prepTime: z.number().int().min(1).optional().default(15),
  stock: z.number().int().min(0).optional().default(0),
  unit: z.string().optional().default('piece'),
  isAvailable: z.boolean().optional().default(true),
  sku: z.string().optional().default(''),
});

export const updateFoodSchema = foodSchema.partial();

export const reviewSchema = z.object({
  food: z.string().min(1, 'Food ID is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(''),
  comment: z.string().trim().max(2000).optional().default(''),
  images: z.array(z.string()).optional().default([]),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  description: z.string().trim().max(200).optional().default(''),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional().default(0),
  maxDiscount: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(0).nullable().optional(),
  perUserLimit: z.number().int().min(0).optional().default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCouponSchema = couponSchema.partial();
