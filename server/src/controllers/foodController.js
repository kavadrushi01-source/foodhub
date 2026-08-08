import Food from '../models/Food.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { paginate } from '../utils/helpers.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Public: list foods with search, filters, sort, pagination.
 * Query params: search, category (slug), cuisine, isVeg, minPrice, maxPrice,
 * sort (price_asc|price_desc|rating|newest|popular), page, limit.
 */
export const getFoods = async (req, res) => {
  const {
    search, category, cuisine, isVeg, minPrice, maxPrice,
    sort = 'newest', page = 1, limit = 12,
  } = req.query;

  const query = { isAvailable: true };

  if (search) {
    query.$text = { $search: search };
  }
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
  }
  if (cuisine) query.cuisine = new RegExp(cuisine, 'i');
  if (isVeg !== undefined) query.isVeg = isVeg === 'true';
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { 'rating.average': -1 },
    newest: { createdAt: -1 },
    popular: { 'rating.count': -1 },
  };
  const sortOption = sortMap[sort] || sortMap.newest;

  let q = Food.find(query).sort(sortOption).populate('category', 'name slug').lean({ virtuals: true });
  const result = await paginate(q, { page, limit });

  return res.status(200).json({ success: true, status: 200, data: result });
};

/** Public: get a single food by slug, with reviews + related items. */
export const getFoodBySlug = async (req, res) => {
  const food = await Food.findOne({ slug: req.params.slug }).populate('category', 'name slug').lean({ virtuals: true });
  if (!food) throw new NotFoundError('Food not found');

  const reviews = await Review.find({ food: food._id, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  let related = await Food.find({ category: food.category._id, _id: { $ne: food._id }, isAvailable: true })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(6)
    .lean({ virtuals: true });

  if (related.length < 6) {
    const exclude = [food._id, ...related.map((r) => r._id)];
    const extra = await Food.find({
      _id: { $nin: exclude }, isAvailable: true,
      $or: [
        { cuisine: food.cuisine },
        { isBestseller: true },
        { category: food.category._id },
      ],
    })
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(8 - related.length)
      .lean({ virtuals: true });
    related = [...related, ...extra];
  }

  return res.status(200).json({
    success: true, status: 200,
    data: { food, reviews, related },
  });
};

/** Public: list categories with live food counts + a representative image. */
export const getCategories = async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean(),
    Food.aggregate([
      { $match: { isAvailable: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, image: { $first: '$primaryImage' } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));
  const enriched = categories.map((c) => ({
    ...c,
    foodCount: countMap.get(String(c._id))?.count || 0,
    image: c.image || countMap.get(String(c._id))?.image || '',
  }));
  return res.status(200).json({ success: true, status: 200, data: { categories: enriched } });
};

/** Public: get bestsellers / new arrivals for home page. */
export const getFeatured = async (req, res) => {
  const [bestsellers, newArrivals, topRated] = await Promise.all([
    Food.find({ isAvailable: true, isBestseller: true }).sort({ 'rating.count': -1 }).limit(8).lean({ virtuals: true }),
    Food.find({ isAvailable: true, isNewArrival: true }).sort({ createdAt: -1 }).limit(8).lean({ virtuals: true }),
    Food.find({ isAvailable: true }).sort({ 'rating.average': -1 }).limit(8).lean({ virtuals: true }),
  ]);
  return res.status(200).json({ success: true, status: 200, data: { bestsellers, newArrivals, topRated } });
};

// ============ REVIEWS ============

export const getReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest' } = req.query;
  const sortOption = sort === 'rating' ? { rating: -1 } : sort === 'helpful' ? { helpfulCount: -1 } : { createdAt: -1 };
  let q = Review.find({ food: req.params.foodId, isApproved: true })
    .populate('user', 'name avatar')
    .sort(sortOption);
  const result = await paginate(q, { page, limit });
  return res.status(200).json({ success: true, status: 200, data: result });
};

export const addReview = async (req, res) => {
  const { food: foodId, rating, title, comment, images } = req.body;
  const food = await Food.findById(foodId);
  if (!food) throw new NotFoundError('Food not found');

  // one review per user per food
  const existing = await Review.findOne({ food: foodId, user: req.user._id });
  if (existing) throw new ValidationError('You have already reviewed this item');

  const review = await Review.create({
    food: foodId, user: req.user._id, name: req.user.name,
    rating, title, comment, images,
  });

  // Recalculate food rating
  const stats = await Review.aggregate([
    { $match: { food: food._id, isApproved: true } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  food.rating = stats[0]
    ? { average: Math.round(stats[0].average * 10) / 10, count: stats[0].count }
    : { average: 0, count: 0 };
  await food.save();

  return res.status(201).json({ success: true, status: 201, message: 'Review added', data: { review } });
};

export const markReviewHelpful = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new NotFoundError('Review not found');
  review.helpfulCount += 1;
  await review.save();
  return res.status(200).json({ success: true, status: 200, message: 'Thanks for your feedback', data: { helpfulCount: review.helpfulCount } });
};
