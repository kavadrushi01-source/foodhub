import Food from '../models/Food.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Settings from '../models/Settings.js';
import { paginate } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

// ============ DASHBOARD ANALYTICS ============

export const getDashboardStats = async (req, res) => {
  const [
    totalRevenue, totalOrders, totalUsers, totalFoods, totalDeliveryPartners,
    pendingOrders, deliveredOrders, recentOrders,
  ] = await Promise.all([
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Food.countDocuments(),
    User.countDocuments({ role: 'delivery' }),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'delivered' }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').lean(),
  ]);

  return res.status(200).json({
    success: true, status: 200,
    data: {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders, totalUsers, totalFoods, totalDeliveryPartners,
      pendingOrders, deliveredOrders, recentOrders,
    },
  });
};

/** Revenue trend over last N days (default 30). */
export const getRevenueReport = async (req, res) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days || '30', 10)));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const trend = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(200).json({ success: true, status: 200, data: { trend, days } });
};

/** Top selling foods by quantity. */
export const getTopFoods = async (req, res) => {
  const top = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.food', name: { $first: '$items.name' }, sold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
    { $sort: { sold: -1 } },
    { $limit: 10 },
  ]);
  return res.status(200).json({ success: true, status: 200, data: { topFoods: top } });
};

/** Category-wise sales distribution. */
export const getCategoryStats = async (req, res) => {
  const stats = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $lookup: { from: 'foods', localField: 'items.food', foreignField: '_id', as: 'food' } },
    { $unwind: '$food' },
    { $group: { _id: '$food.category', revenue: { $sum: '$items.lineTotal' }, count: { $sum: '$items.quantity' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, name: '$category.name', revenue: 1, count: 1 } },
    { $sort: { revenue: -1 } },
  ]);
  return res.status(200).json({ success: true, status: 200, data: { categoryStats: stats } });
};

// ============ FOOD CRUD ============

export const createFood = async (req, res) => {
  const food = await Food.create(req.body);
  return res.status(201).json({ success: true, status: 201, message: 'Food created', data: { food } });
};

export const updateFood = async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!food) throw new NotFoundError('Food not found');
  return res.status(200).json({ success: true, status: 200, message: 'Food updated', data: { food } });
};

export const deleteFood = async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw new NotFoundError('Food not found');
  return res.status(200).json({ success: true, status: 200, message: 'Food deleted' });
};

export const getFoodsAdmin = async (req, res) => {
  const { search, page = 1, limit = 20, category, isAvailable } = req.query;
  const filter = {};
  if (search) filter.name = new RegExp(search, 'i');
  if (category) filter.category = category;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  let q = Food.find(filter).populate('category', 'name slug').sort({ createdAt: -1 });
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const updateStock = async (req, res) => {
  const { stock } = req.body;
  const food = await Food.findByIdAndUpdate(req.params.id, { stock }, { new: true });
  if (!food) throw new NotFoundError('Food not found');
  return res.status(200).json({ success: true, status: 200, message: 'Stock updated', data: { food } });
};

// ============ CATEGORY CRUD ============

export const createCategory = async (req, res) => {
  const existing = await Category.findOne({ $or: [{ name: req.body.name }, { slug: req.body.slug }] });
  if (existing) throw new ConflictError('Category already exists');
  const category = await Category.create(req.body);
  return res.status(201).json({ success: true, status: 201, message: 'Category created', data: { category } });
};

export const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new NotFoundError('Category not found');
  return res.status(200).json({ success: true, status: 200, message: 'Category updated', data: { category } });
};

export const deleteCategory = async (req, res) => {
  const foodCount = await Food.countDocuments({ category: req.params.id });
  if (foodCount > 0) throw new ConflictError('Cannot delete category with existing foods. Reassign or remove foods first.');
  await Category.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, status: 200, message: 'Category deleted' });
};

export const getCategoriesAdmin = async (req, res) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 }).lean();
  return res.status(200).json({ success: true, status: 200, data: { categories } });
};

// ============ COUPON CRUD ============

export const createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json({ success: true, status: 201, message: 'Coupon created', data: { coupon } });
};

export const updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new NotFoundError('Coupon not found');
  return res.status(200).json({ success: true, status: 200, message: 'Coupon updated', data: { coupon } });
};

export const deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  return res.status(200).json({ success: true, status: 200, message: 'Coupon deleted' });
};

export const getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json({ success: true, status: 200, data: { coupons } });
};


// ============ USER / ROLE MANAGEMENT ============

export const getUsers = async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  let q = User.find(filter).sort({ createdAt: -1 });
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new NotFoundError('User not found');
  return res.status(200).json({ success: true, status: 200, message: 'Role updated', data: { user: user.toJSON() } });
};

export const toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  user.isActive = !user.isActive;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: user.isActive ? 'User activated' : 'User deactivated', data: { isActive: user.isActive } });
};

// ============ REVIEW MANAGEMENT ============

export const getReviewsAdmin = async (req, res) => {
  const { page = 1, limit = 20, reported } = req.query;
  const filter = {};
  if (reported === 'true') filter.reportedCount = { $gt: 0 };
  let q = Review.find(filter).populate('food', 'name').populate('user', 'name').sort({ createdAt: -1 });
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new NotFoundError('Review not found');
  const food = await Food.findById(review.food);
  await review.deleteOne();
  if (food) {
    const stats = await Review.aggregate([
      { $match: { food: food._id, isApproved: true } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    food.rating = stats[0] ? { average: Math.round(stats[0].average * 10) / 10, count: stats[0].count } : { average: 0, count: 0 };
    await food.save();
  }
  return res.status(200).json({ success: true, status: 200, message: 'Review deleted' });
};

// ============ SETTINGS ============

export const getSettings = async (req, res) => {
  const settings = await Settings.getSettings();
  return res.status(200).json({ success: true, status: 200, data: { settings } });
};

export const updateSettings = async (req, res) => {
  const settings = await Settings.getSettings();
  // Deep merge nested objects
  for (const key of Object.keys(req.body)) {
    if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
      settings[key] = { ...settings[key].toObject?.() ?? settings[key], ...req.body[key] };
    } else {
      settings[key] = req.body[key];
    }
  }
  await settings.save();
  return res.status(200).json({ success: true, status: 200, message: 'Settings updated', data: { settings } });
};

