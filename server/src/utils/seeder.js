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
  { name: 'Street Food', slug: 'street-food', icon: '🍟', description: 'Crispy chips, fries & street snacks', displayOrder: 4 },
  { name: 'Starters', slug: 'starters', icon: '🍢', description: 'Tandoori & fried appetizers', displayOrder: 5 },
  { name: 'Chinese', slug: 'chinese', icon: '🥡', description: 'Noodles, manchurian & fried rice', displayOrder: 6 },
  { name: 'Desserts', slug: 'desserts', icon: '🍰', description: 'Sweet endings', displayOrder: 7 },
  { name: 'Beverages', slug: 'beverages', icon: '🥤', description: 'Refreshing drinks', displayOrder: 8 },
  { name: 'Salads', slug: 'salads', icon: '🥗', description: 'Fresh healthy bowls', displayOrder: 9 },
  { name: 'Pasta', slug: 'pasta', icon: '🍝', description: 'Italian classics', displayOrder: 10 },
  { name: 'Sushi', slug: 'sushi', icon: '🍣', description: 'Fresh sushi & rolls', displayOrder: 11 },
  { name: 'Sandwiches', slug: 'sandwiches', icon: '🥪', description: 'Toasted & club sandwiches', displayOrder: 12 },
  { name: 'Shakes', slug: 'shakes', icon: '🍹', description: 'Creamy thick shakes', displayOrder: 13 },
];

const foods = [
  { name: 'Classic Veg Burger', slug: 'classic-veg-burger', category: 'Burgers', price: 149, discountPrice: 119, isBestseller: true, isVeg: true, cuisine: 'American', prepTime: 15, stock: 50,
    description: 'A crispy potato patty topped with fresh lettuce, tomatoes, onions, and our signature tangy mayo, all hugged by a toasted brioche bun.',
    images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800'], ingredients: ['Potato patty', 'Lettuce', 'Tomato', 'Onion', 'Mayo', 'Brioche bun'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 480, protein: 18, carbs: 52, fat: 21, fiber: 4 }, tags: ['bestseller', 'veg'] },
  { name: 'Crispy Chicken Burger', slug: 'crispy-chicken-burger', category: 'Burgers', price: 199, discountPrice: 169, isVeg: false, cuisine: 'American', prepTime: 16, stock: 35,
    description: 'Juicy fried chicken fillet with crunchy slaw, pickles and a smoky chipotle mayo in a sesame brioche bun.',
    images: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'], ingredients: ['Chicken', 'Slaw', 'Pickles', 'Chipotle mayo', 'Brioche bun'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 590, protein: 30, carbs: 45, fat: 27, fiber: 3 }, tags: ['bestseller', 'non-veg'] },
  { name: 'Margherita Pizza', slug: 'margherita-pizza', category: 'Pizza', price: 279, discountPrice: 239, isVeg: true, cuisine: 'Italian', prepTime: 22, stock: 25,
    description: 'Classic Neapolitan pizza with San Marzano tomato sauce, fresh mozzarella and basil on a blistered crust.',
    images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'], ingredients: ['Tomato sauce', 'Mozzarella', 'Basil', 'Olive oil'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 480, protein: 18, carbs: 52, fat: 21, fiber: 4 }, tags: ['veg', 'classic'] },
  { name: 'Cheese Burst Pizza', slug: 'cheese-burst-pizza', category: 'Pizza', price: 349, discountPrice: 299, isBestseller: true, isVeg: true, cuisine: 'Italian', prepTime: 25, stock: 30,
    description: 'Double cheese mozzarella over a hand-tossed base, loaded with bell peppers, olives, and sweet corn. A cheese lovers dream.',
    images: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'], ingredients: ['Mozzarella', 'Bell peppers', 'Olives', 'Corn', 'Tomato sauce'], allergens: ['Gluten', 'Dairy'],
    nutrition: { calories: 290, protein: 12, carbs: 36, fat: 11, fiber: 2 }, tags: ['bestseller', 'veg', 'cheesy'] },
  { name: 'Chicken Tikka Biryani', slug: 'chicken-tikka-biryani', category: 'Biryani', price: 259, isVeg: false, cuisine: 'Indian', prepTime: 30, stock: 40, isBestseller: true,
    description: 'Long-grain basmati rice slow-cooked with marinated chicken tikka, saffron, and aromatic spices. Served with a cooling raita.',
    images: ['https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800'], ingredients: ['Basmati rice', 'Chicken', 'Saffron', 'Yogurt', 'Spices'], allergens: ['Dairy'],
    nutrition: { calories: 540, protein: 28, carbs: 62, fat: 18, fiber: 3 }, tags: ['spicy', 'non-veg'] },
  { name: 'Veg Dum Biryani', slug: 'veg-dum-biryani', category: 'Biryani', price: 219, isVeg: true, cuisine: 'Indian', prepTime: 32, stock: 45,
    description: 'Fragrant basmati rice layered with seasonal vegetables, mint and saffron, slow-cooked on a dum and served with raita.',
    images: ['https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800'], ingredients: ['Basmati rice', 'Mixed vegetables', 'Mint', 'Saffron', 'Yogurt'], allergens: ['Dairy'],
    nutrition: { calories: 460, protein: 10, carbs: 78, fat: 12, fiber: 5 }, tags: ['veg', 'comfort'] },
  { name: 'Masala Potato Chips', slug: 'masala-potato-chips', category: 'Street Food', price: 89, discountPrice: 69, isBestseller: true, isVeg: true, cuisine: 'Indian', prepTime: 8, stock: 80,
    description: 'Golden crispy potato chips tossed in fiery chaat masala with a squeeze of lemon. Crunch in every bite.',
    images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800'], ingredients: ['Potatoes', 'Chaat masala', 'Lemon', 'Red chilli'], allergens: [], nutrition: { calories: 310, protein: 4, carbs: 38, fat: 16, fiber: 4 }, tags: ['bestseller', 'veg', 'crispy'] },
  { name: 'Peri Peri Fries', slug: 'peri-peri-fries', category: 'Street Food', price: 129, discountPrice: 99, isVeg: true, cuisine: 'Portuguese', prepTime: 10, stock: 70,
    description: 'Crispy hand-cut fries dusted with peri peri seasoning, served with a tangy garlic dip. Add cheese for extra indulgence.',
    images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800'], ingredients: ['Potatoes', 'Peri peri spice', 'Garlic dip'], allergens: ['Dairy'], nutrition: { calories: 380, protein: 6, carbs: 48, fat: 18, fiber: 5 }, tags: ['veg', 'spicy'] },
  { name: 'Cheese Nachos', slug: 'cheese-nachos', category: 'Street Food', price: 179, discountPrice: 149, isVeg: true, cuisine: 'Mexican', prepTime: 12, stock: 40,
    description: 'Crunchy tortilla chips smothered in warm cheese sauce, jalapeños, salsa and sour cream. Perfect sharing snack.',
    images: ['https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800'], ingredients: ['Tortilla chips', 'Cheese', 'Jalapeños', 'Salsa', 'Sour cream'], allergens: ['Dairy'], nutrition: { calories: 520, protein: 16, carbs: 45, fat: 28, fiber: 6 }, tags: ['veg', 'shareable'] },
  { name: 'Crispy Samosa (2 pcs)', slug: 'crispy-samosa-2pcs', category: 'Street Food', price: 49, isVeg: true, cuisine: 'Indian', prepTime: 12, stock: 100,
    description: 'Flaky golden samosas stuffed with spiced potato and peas, served with tangy tamarind and mint chutneys.',
    images: ['https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'], ingredients: ['Potato', 'Peas', 'Spices', 'Flour', 'Tamarind chutney'], allergens: ['Gluten'], nutrition: { calories: 230, protein: 5, carbs: 30, fat: 10, fiber: 3 }, tags: ['veg', 'snack'] },
  { name: 'Paneer Tikka', slug: 'paneer-tikka', category: 'Starters', price: 229, discountPrice: 199, isVeg: true, cuisine: 'Indian', prepTime: 18, stock: 30,
    description: 'Smoky char-grilled paneer cubes marinated in yogurt and tandoori spices, served with mint chutney and onion rings.',
    images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'], ingredients: ['Paneer', 'Yogurt', 'Tandoori spices', 'Mint chutney'], allergens: ['Dairy'], nutrition: { calories: 320, protein: 18, carbs: 12, fat: 24, fiber: 2 }, tags: ['veg', 'tandoori'] },
  { name: 'Hara Bhara Kebab', slug: 'hara-bhara-kebab', category: 'Starters', price: 189, isVeg: true, cuisine: 'Indian', prepTime: 15, stock: 35,
    description: 'Crispy golden kebabs made from spinach, green peas and potato, served with mint mayo. Light yet flavourful.',
    images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800'], ingredients: ['Spinach', 'Green peas', 'Potato', 'Mint mayo'], allergens: [], nutrition: { calories: 240, protein: 7, carbs: 28, fat: 12, fiber: 4 }, tags: ['veg', 'healthy'] },
  { name: 'Veg Hakka Noodles', slug: 'veg-hakka-noodles', category: 'Chinese', price: 169, discountPrice: 139, isBestseller: true, isVeg: true, cuisine: 'Chinese', prepTime: 12, stock: 40,
    description: 'Wok-tossed noodles with cabbage, carrots, capsicum and spring onions in a smoky garlic soy sauce.',
    images: ['https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800'], ingredients: ['Noodles', 'Cabbage', 'Carrots', 'Capsicum', 'Soy sauce'], allergens: ['Gluten'], nutrition: { calories: 420, protein: 10, carbs: 68, fat: 12, fiber: 4 }, tags: ['veg', 'wok'] },
  { name: 'Chicken Manchurian', slug: 'chicken-manchurian', category: 'Chinese', price: 219, discountPrice: 189, isVeg: false, cuisine: 'Chinese', prepTime: 16, stock: 30,
    description: 'Crispy chicken balls tossed in a glossy Indo-Chinese sauce with ginger, garlic and spring onions.',
    images: ['https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800'], ingredients: ['Chicken', 'Soy sauce', 'Ginger', 'Garlic', 'Spring onions'], allergens: ['Gluten'], nutrition: { calories: 460, protein: 24, carbs: 40, fat: 22, fiber: 3 }, tags: ['non-veg', 'indochinese'] },
  { name: 'Chocolate Lava Cake', slug: 'chocolate-lava-cake', category: 'Desserts', price: 129, isVeg: true, cuisine: 'French', prepTime: 12, stock: 25, isNewArrival: true,
    description: 'Warm chocolate cake with a molten centre, dusted with cocoa and served with a scoop of vanilla bean ice cream.',
    images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'], ingredients: ['Dark chocolate', 'Butter', 'Eggs', 'Flour', 'Sugar'], allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutrition: { calories: 410, protein: 6, carbs: 44, fat: 24, fiber: 2 }, tags: ['dessert', 'chocolate'] },
  { name: 'Gulab Jamun (2 pcs)', slug: 'gulab-jamun-2pcs', category: 'Desserts', price: 99, isVeg: true, cuisine: 'Indian', prepTime: 10, stock: 50,
    description: 'Soft, syrupy khoya dumplings flavoured with cardamom and rose water. A timeless Indian sweet.',
    images: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800'], ingredients: ['Khoya', 'Sugar', 'Cardamom', 'Rose water'], allergens: ['Dairy'], nutrition: { calories: 280, protein: 4, carbs: 48, fat: 9, fiber: 0 }, tags: ['dessert', 'sweet'] },
  { name: 'Fresh Lime Soda', slug: 'fresh-lime-soda', category: 'Beverages', price: 79, isVeg: true, cuisine: 'Indian', prepTime: 5, stock: 80,
    description: 'Tangy lime juice mixed with sweet or salted soda. The perfect refreshing companion to any meal.',
    images: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800'], nutrition: { calories: 90, protein: 0, carbs: 23, fat: 0, fiber: 0 }, tags: ['refreshing'] },
  { name: 'Masala Chai', slug: 'masala-chai', category: 'Beverages', price: 59, isVeg: true, cuisine: 'Indian', prepTime: 6, stock: 90,
    description: 'Frothy spiced Indian tea brewed with ginger, cardamom, clove and cinnamon. Served piping hot.',
    images: ['https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800'], ingredients: ['Milk', 'Tea', 'Ginger', 'Cardamom', 'Cinnamon'], allergens: ['Dairy'], nutrition: { calories: 120, protein: 4, carbs: 18, fat: 4, fiber: 0 }, tags: ['beverage', 'chai'] },
  { name: 'Garden Fresh Salad', slug: 'garden-fresh-salad', category: 'Salads', price: 199, isVeg: true, cuisine: 'Continental', prepTime: 10, stock: 20, isNewArrival: true,
    description: 'Crisp romaine, cherry tomatoes, cucumber, carrots, and sprouts tossed in a light vinaigrette with a sprinkle of seeds.',
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'], nutrition: { calories: 150, protein: 5, carbs: 14, fat: 8, fiber: 5 }, tags: ['healthy', 'low-cal'] },
  { name: 'Creamy Alfredo Pasta', slug: 'creamy-alfredo-pasta', category: 'Pasta', price: 229, discountPrice: 199, isVeg: true, cuisine: 'Italian', prepTime: 20, stock: 35,
    description: 'Penne pasta tossed in a rich parmesan cream sauce with garlic, mushrooms, and a touch of black pepper.',
    images: ['https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800'], nutrition: { calories: 520, protein: 15, carbs: 58, fat: 24, fiber: 3 }, tags: ['creamy', 'veg'] },
  { name: 'Salmon Nigiri Platter', slug: 'salmon-nigiri-platter', category: 'Sushi', price: 399, isVeg: false, cuisine: 'Japanese', prepTime: 18, stock: 15, isBestseller: true,
    description: 'Eight pieces of fresh salmon nigiri on seasoned sushi rice, served with wasabi, pickled ginger, and soy sauce.',
    images: ['https://images.unsplash.com/photo-1563612116625-3012372fccce?w=800'], nutrition: { calories: 320, protein: 22, carbs: 38, fat: 9, fiber: 1 }, tags: ['fresh', 'premium'] },
  { name: 'California Roll (8 pcs)', slug: 'california-roll-8pcs', category: 'Sushi', price: 299, isVeg: false, cuisine: 'Japanese', prepTime: 16, stock: 12,
    description: 'Crab, avocado and cucumber rolled in nori and sushi rice, topped with toasted sesame and tobiko.',
    images: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'], ingredients: ['Crab', 'Avocado', 'Cucumber', 'Sushi rice', 'Sesame'], allergens: ['Fish', 'Soy'], nutrition: { calories: 280, protein: 14, carbs: 40, fat: 8, fiber: 3 }, tags: ['fresh', 'roll'] },
  { name: 'Grilled Veg Sandwich', slug: 'grilled-veg-sandwich', category: 'Sandwiches', price: 129, discountPrice: 109, isVeg: true, cuisine: 'Continental', prepTime: 12, stock: 45, isBestseller: true,
    description: 'Toasted sourdough stacked with spiced potatoes, cucumber, tomato and zingy mint chutney. Grilled to golden perfection.',
    images: ['https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800'], ingredients: ['Sourdough', 'Potato', 'Cucumber', 'Tomato', 'Mint chutney'], allergens: ['Gluten'], nutrition: { calories: 380, protein: 12, carbs: 52, fat: 14, fiber: 6 }, tags: ['veg', 'grilled'] },
  { name: 'Oreo Crunch Shake', slug: 'oreo-crunch-shake', category: 'Shakes', price: 149, discountPrice: 129, isVeg: true, cuisine: 'American', prepTime: 6, stock: 40, isNewArrival: true,
    description: 'Thick vanilla shake blended with crushed Oreo cookies and topped with whipped cream and more cookie crumbs.',
    images: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800'], ingredients: ['Vanilla ice cream', 'Milk', 'Oreo', 'Whipped cream'], allergens: ['Dairy'], nutrition: { calories: 480, protein: 8, carbs: 68, fat: 21, fiber: 1 }, tags: ['shake', 'sweet'] },
  { name: 'Fresh Mango Shake', slug: 'fresh-mango-shake', category: 'Shakes', price: 139, isVeg: true, cuisine: 'Indian', prepTime: 6, stock: 60,
    description: 'Alphonso mango blended with chilled milk and a hint of cardamom — summer in a glass.',
    images: ['https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800'], ingredients: ['Mango', 'Milk', 'Sugar', 'Cardamom'], allergens: ['Dairy'], nutrition: { calories: 300, protein: 6, carbs: 54, fat: 8, fiber: 2 }, tags: ['shake', 'fruit'] },
  { name: 'Steamed Chicken Momos', slug: 'steamed-chicken-momos', category: 'Street Food', price: 129, isVeg: false, cuisine: 'Tibetan', prepTime: 18, stock: 45, isNewArrival: true,
    description: 'Ten soft steamed momos stuffed with juicy minced chicken, served with spicy tomato chutney.',
    images: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800'], ingredients: ['Chicken', 'Flour', 'Onion', 'Garlic', 'Tomato chutney'], allergens: ['Gluten'], nutrition: { calories: 350, protein: 18, carbs: 45, fat: 12, fiber: 2 }, tags: ['non-veg', 'street'] },
  { name: 'Family Feast Platter', slug: 'family-feast-platter', category: 'Starters', price: 399, discountPrice: 349, isBestseller: true, isVeg: false, cuisine: 'Mixed', prepTime: 25, stock: 15,
    description: 'A shareable platter of chicken tikka, kebab, paneer bites, fries and two dips — feast for 2–3.',
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'], ingredients: ['Chicken tikka', 'Kebab', 'Paneer', 'Fries', 'Dips'], allergens: ['Dairy'], nutrition: { calories: 720, protein: 34, carbs: 55, fat: 38, fiber: 5 }, tags: ['non-veg', 'shareable'] },
];

const coupons = [
  { code: 'WELCOME10', description: '10% off first order', type: 'percentage', value: 10, maxDiscount: 100, minOrder: 200, maxUses: 1000, endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  { code: 'FLAT50', description: 'Flat ₹50 off above ₹300', type: 'fixed', value: 50, minOrder: 300, maxUses: 500, endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { code: 'FOODIE20', description: '20% off above ₹500', type: 'percentage', value: 20, maxDiscount: 150, minOrder: 500, maxUses: 200, endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
];

const defaultUsers = [
  { name: 'Admin User', email: 'admin@foodhub.com', password: 'Admin@123', role: 'admin', isEmailVerified: true },
  { name: 'Test Customer', email: 'user@foodhub.com', password: 'User@123', role: 'user', isEmailVerified: true },
  { name: 'Delivery Partner', email: 'delivery@foodhub.com', password: 'Delivery@123', role: 'delivery', isEmailVerified: true, deliveryProfile: { vehicleNumber: 'MH12AB1234', vehicleType: 'bike', isOnline: true, rating: 4.8 } },
];

// Upsert defaults without throwing when they already exist
const upsertIfNeeded = async (Model, docs, filterFn) => {
  const inserted = [];
  for (const doc of docs) {
    const filter = filterFn(doc);
    const exists = await Model.findOne(filter);
    if (!exists) {
      const created = await Model.create(doc);
      inserted.push(created);
    }
  }
  return inserted;
};

/**
 * Idempotent seed in "sync" mode: always inserts what is missing (new
 * categories, foods, coupons, users) keyed by stable slug/code/email.
 * Never deletes or overwrites existing data — safe to run on every boot in
 * any environment, including an already-seeded production DB.
 */
export const seedIfEmpty = async () => {
  await upsertIfNeeded(User, defaultUsers, (u) => ({ email: u.email }));

  const existingCatSlugs = new Set((await Category.find().select('slug')).map((c) => c.slug));
  const newCatDocs = categories.filter((c) => !existingCatSlugs.has(c.slug));
  if (newCatDocs.length) await Category.insertMany(newCatDocs);
  // Build the name→id map from ALL categories (existing + new) so foods that
  // target pre-existing categories resolve correctly.
  const allCats = await Category.find().select('name').lean();
  const catMap = new Map(allCats.map((c) => [c.name, c._id]));

  const existingFoodSlugs = new Set((await Food.find().select('slug')).map((f) => f.slug));
  const foodDocs = foods
    .filter((f) => !existingFoodSlugs.has(f.slug))
    .map((f) => ({ ...f, category: catMap.get(f.category) }))
    .filter((f) => f.category);
  if (foodDocs.length) await Food.insertMany(foodDocs);

  const existingCouponCodes = new Set((await Coupon.find().select('code')).map((c) => c.code));
  const newCoupons = coupons.filter((c) => !existingCouponCodes.has(c.code));
  if (newCoupons.length) await Coupon.insertMany(newCoupons);

  // Dedupe cloned seed dishes: earlier seeds stored auto-slugged copies
  // ("classic-veg-burger-4iku") while the new sync uses clean slugs. If both a
  // clean-slug food and a suffixed clone with the SAME name exist, drop the
  // suffix clone so the menu shows each dish exactly once.
  const nameToSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const allFoods = await Food.find({}, 'name slug');
  const cleanSlugs = new Set(allFoods.filter((f) => /^[a-z0-9-]+$/.test(f.slug)).map((f) => f.slug));
  const cloneIds = allFoods
    .filter((f) => /-[0-9a-z]{4}$/.test(f.slug) && cleanSlugs.has(nameToSlug(f.name)))
    .map((f) => f._id);
  if (cloneIds.length) {
    await Food.deleteMany({ _id: { $in: cloneIds } });
    logger.info(`🧹 Removed ${cloneIds.length} duplicate seed clones`);
  }

  // --- Image health pass ---------------------------------------------
  // 1) Known-broken URLs (hotlinks that 404 / need auth) -> working ones.
  const imageFixups = {
    'pizza-nrcp': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', // was media.istockphoto.com (400)
  };
  // Verified working representative images used when a food has an empty or
  // non-Unsplash image, keyed by category name.
  const UNSPLASH = 'images.unsplash.com';
  for (const [slug, url] of Object.entries(imageFixups)) {
    const hit = await Food.findOneAndUpdate({ slug }, { $set: { primaryImage: url, images: [url] } });
    if (hit) logger.info(`🖼️ Image fix applied: ${slug}`);
  }
  // Any food still with an empty image or an image hosted elsewhere gets a
  // working dish photo from its own category.
  const broken = await Food.find().lean();
  const catDefaults = new Map();
  for (const f of broken) {
    if (!catDefaults.has(String(f.category))) {
      const img = f.primaryImage || f.images?.[0] || '';
      if (img.includes(UNSPLASH)) catDefaults.set(String(f.category), img);
    }
  }
  if (!catDefaults.size) {
    const catWithImg = await Food.findOne({}, 'category primaryImage images').lean();
    if (catWithImg) {
      const img = catWithImg.primaryImage || catWithImg.images?.[0] || '';
      if (img) catDefaults.set(String(catWithImg.category), img);
    }
  }
  let imageFixes = 0;
  for (const f of broken) {
    const current = f.primaryImage || f.images?.[0] || '';
    const needsFix = !current || !current.includes('images.unsplash.com');
    if (needsFix && catDefaults.size) {
      const img = catDefaults.get(String(f.category)) || [...catDefaults.values()][0];
      if (img) {
        await Food.updateOne({ _id: f._id }, { $set: { primaryImage: img, images: img ? [img] : [] } });
        imageFixes += 1;
      }
    }
  }
  if (imageFixes) logger.info(`🖼️ Fixed ${imageFixes} foods with empty/broken images`);

  const settings = await Settings.findOne({ key: 'store' });
  if (!settings) {
    await Settings.create({ key: 'store' });
  } else {
    // Backfill new delivery fields for already-seeded production DBs so
    // features like "free delivery on online payments" are enabled by default.
    const delivery = settings.delivery || {};
    const updates = {};
    if (delivery.freeDeliveryViaOnlinePayment === undefined) updates['delivery.freeDeliveryViaOnlinePayment'] = true;
    if (!delivery.freeDeliveryMessage) updates['delivery.freeDeliveryMessage'] = 'Free delivery on online payments & orders above ₹299';
    if (Object.keys(updates).length) {
      await Settings.updateOne({ key: 'store' }, { $set: updates });
    }
  }

  logger.info(
    `✅ Seed sync complete: +${newCatDocs.length} categories, +${foodDocs.length} foods, +${newCoupons.length} coupons`
  );
};

const seed = async () => {
  try {
    await connectDB();
    await seedIfEmpty();
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

// Only run `seed` directly when invoked as a script (node src/utils/seeder.js)
const isMain = process.argv[1] && process.argv[1].endsWith('seeder.js');
if (isMain) {
  seed();
}

export default seed;