import mongoose from 'mongoose';
import config from '../config/index.js';
import logger from '../config/logger.js';
import { connectDB } from '../config/database.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Food from '../models/Food.js';
import Coupon from '../models/Coupon.js';
import Settings from '../models/Settings.js';

const categories = [
  { name: 'Burgers', slug: 'burgers', icon: '🍔', description: 'Juicy grilled burgers', displayOrder: 1 },
  { name: 'Pizza', slug: 'pizza', icon: '🍕', description: 'Wood-fired pizzas', displayOrder: 2 },
  { name: 'Biryani', slug: 'biryani', icon: '🍚', description: 'Aromatic rice dishes', displayOrder: 3 },
  { name: 'Desserts', slug: 'desserts', icon: '🍰', description: 'Sweet endings', displayOrder: 4 },
  { name: 'Beverages', slug: 'beverages', icon: '🥤', description: 'Refreshing drinks', displayOrder: 5 },
  { name: 'Salads', slug: 'salads', icon: '🥗', description: 'Fresh healthy bowls', displayOrder: 6 },
  { name: 'Pasta', slug: 'pasta', icon: '🍝', description: 'Italian classics', displayOrder: 7 },
  { name: 'Sushi', slug: 'sushi', icon: '🍣', description: 'Fresh sushi & rolls', displayOrder: 8 },
];

const foods = [
  { name: 'Classic Veg Burger', category: 'Burgers', price: 149, discountPrice: 119, isBestseller: true, isVeg: true, cuisine: 'American', prepTime: 15, stock: 50,
    description: 'A crispy potato patty topped with fresh lettuce, tomatoes, onions, and our signature tangy mayo, all hugged by a toasted brioche bun.',
    images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800'], ingredients: ['Potato patty', 'Lettuce', 'Tomato', 'Onion', 'Mayo', 'Brioche bun'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 480, protein: 18, carbs: 52, fat: 21, fiber: 4 }, tags: ['bestseller', 'veg'] },
  { name: 'Cheese Burst Pizza', category: 'Pizza', price: 349, discountPrice: 299, isBestseller: true, isVeg: true, cuisine: 'Italian', prepTime: 25, stock: 30,
    description: 'Double cheese mozzarella over a hand-tossed base, loaded with bell peppers, olives, and sweet corn. A cheese lovers dream.',
    images: ['https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800'], ingredients: ['Mozzarella', 'Bell peppers', 'Olives', 'Corn', 'Tomato sauce'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 290, protein: 12, carbs: 36, fat: 11, fiber: 2 }, tags: ['bestseller', 'veg', 'cheesy'] },
  { name: 'Chicken Tikka Biryani', category: 'Biryani', price: 259, isVeg: false, cuisine: 'Indian', prepTime: 30, stock: 40, isBestseller: true,
    description: 'Long-grain basmati rice slow-cooked with marinated chicken tikka, saffron, and aromatic spices. Served with raita and salan.',
    images: ['https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=800'], ingredients: ['Basmati rice', 'Chicken', 'Saffron', 'Yogurt', 'Spices'], allergens: ['Dairy'],
    nutrition: { calories: 540, protein: 28, carbs: 62, fat: 18, fiber: 3 }, tags: ['spicy', 'non-veg'] },
  { name: 'Chocolate Lava Cake', category: 'Desserts', price: 129, isVeg: true, cuisine: 'French', prepTime: 12, stock: 25, isNewArrival: true,
    description: 'Warm chocolate cake with a molten centre, dusted with cocoa and served with a scoop of vanilla bean ice cream.',
    images: ['https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'], ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Flour', 'Sugar'], allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutrition: { calories: 410, protein: 6, carbs: 44, fat: 24, fiber: 2 }, tags: ['dessert', 'chocolate'] },
  { name: 'Fresh Lime Soda', category: 'Beverages', price: 79, isVeg: true, cuisine: 'Indian', prepTime: 5, stock: 80,
    description: 'Tangy lime juice mixed with sweet or salted soda. The perfect refreshing companion to any meal.',
    images: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800'], ingredients: ['Lime', 'Soda', 'Sugar/Salt'], allergens: [],
    nutrition: { calories: 90, protein: 0, carbs: 23, fat: 0, fiber: 0 }, tags: ['refreshing'] },
  { name: 'Garden Fresh Salad', category: 'Salads', price: 199, isVeg: true, cuisine: 'Continental', prepTime: 10, stock: 20, isNewArrival: true,
    description: 'Crisp romaine, cherry tomatoes, cucumber, carrots, and sprouts tossed in a light vinaigrette with a sprinkle of seeds.',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'], ingredients: ['Romaine', 'Tomato', 'Cucumber', 'Carrot', 'Sprouts', 'Vinaigrette'], allergens: [],
    nutrition: { calories: 150, protein: 5, carbs: 14, fat: 8, fiber: 5 }, tags: ['healthy', 'low-cal'] },
  { name: 'Creamy Alfredo Pasta', category: 'Pasta', price: 229, discountPrice: 199, isVeg: true, cuisine: 'Italian', prepTime: 20, stock: 35,
    description: 'Penne pasta tossed in a rich parmesan cream sauce with garlic, mushrooms, and a touch of black pepper.',
    images: ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800'], ingredients: ['Penne', 'Parmesan', 'Cream', 'Garlic', 'Mushrooms'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 520, protein: 15, carbs: 58, fat: 24, fiber: 3 }, tags: ['creamy', 'veg'] },
  { name: 'Salmon Nigiri Platter', category: 'Sushi', price: 399, isVeg: false, cuisine: 'Japanese', prepTime: 18, stock: 15, isBestseller: true,
    description: 'Six pieces of fresh salmon nigiri on seasoned sushi rice, served with wasabi, pickled ginger, and soy sauce.',
    images: ['https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800'], ingredients: ['Salmon', 'Sushi rice', 'Nori', 'Wasabi'], allergens: ['Fish', 'Soy'],
    nutrition: { calories: 320, protein: 22, carbs: 38, fat: 9, fiber: 1 }, tags: ['fresh', 'premium'] },
];

const coupons = [
  { code: 'WELCOME10', description: '10% off first order', type: 'percentage', value: 10, maxDiscount: 100, minOrder: 200, maxUses: 1000, endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  { code: 'FLAT50', description: 'Flat ₹50 off above ₹300', type: 'fixed', value: 50, minOrder: 300, maxUses: 500, endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { code: 'FOODIE20', description: '20% off above ₹500', type: 'percentage', value: 20, maxDiscount: 150, minOrder: 500, maxUses: 200, endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
];


const seed = async () => {
  try {
    await connectDB();
    logger.info('🌱 Seeding database...');
    if (config.env !== 'production') {
      await Promise.all([User.deleteMany({}), Category.deleteMany({}), Food.deleteMany({}), Coupon.deleteMany({}), Settings.deleteMany({})]);
      logger.info('🧹 Cleared existing data');
    }
    await User.create({ name: 'Admin User', email: 'admin@foodhub.com', password: 'Admin@123', role: 'admin', isEmailVerified: true });
    await User.create({ name: 'Test Customer', email: 'user@foodhub.com', password: 'User@123', role: 'user', isEmailVerified: true });
    await User.create({ name: 'Delivery Partner', email: 'delivery@foodhub.com', password: 'Delivery@123', role: 'delivery', isEmailVerified: true, deliveryProfile: { vehicleNumber: 'MH12AB1234', vehicleType: 'bike', isOnline: true, rating: 4.8 } });
    logger.info('👤 Created users (admin/user/delivery)');

    const catDocs = await Category.insertMany(categories);
    const catMap = new Map(catDocs.map((c) => [c.name, c._id]));
    const foodDocs = foods.map((f) => ({ ...f, category: catMap.get(f.category) }));
    await Food.insertMany(foodDocs);
    logger.info(`🍽️ Inserted ${foodDocs.length} foods across ${catDocs.length} categories`);
    await Coupon.insertMany(coupons);
    logger.info(`🎟️ Inserted ${coupons.length} coupons`);
    await Settings.create({ key: 'store' });

    logger.info('✅ Seeding complete!');
    logger.info('   Admin login:     admin@foodhub.com / Admin@123');
    logger.info('   User login:      user@foodhub.com / User@123');
    logger.info('   Delivery login:  delivery@foodhub.com / Delivery@123');
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

