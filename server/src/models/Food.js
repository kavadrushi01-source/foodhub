import mongoose from 'mongoose';

const nutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    servingSize: { type: String, default: '1 serving' },
  },
  { _id: false },
);

const ratingSchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 2000 },
    shortDescription: { type: String, default: '', maxlength: 160 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    cuisine: { type: String, default: 'Indian', trim: true },
    tags: [{ type: String, trim: true }],

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'INR' },

    images: [{ type: String }],
    primaryImage: { type: String, default: '' },

    ingredients: [{ type: String, trim: true }],
    allergens: [{ type: String, trim: true }],
    nutrition: { type: nutritionSchema, default: () => ({}) },

    isVeg: { type: Boolean, default: true },
    isSpicy: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },

    prepTime: { type: Number, default: 15 }, // minutes

    rating: { type: ratingSchema, default: { average: 0, count: 0 } },

    stock: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'piece' },
    isAvailable: { type: Boolean, default: true },

    sku: { type: String, default: '' },
  },
  { timestamps: true, virtuals: true },
);

foodSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = `${this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`;
  }
  if (!this.primaryImage && this.images?.length) {
    this.primaryImage = this.images[0];
  }
  next();
});

foodSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice != null && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

foodSchema.virtual('discountPercent').get(function () {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

foodSchema.set('toJSON', { virtuals: true });
foodSchema.set('toObject', { virtuals: true });

foodSchema.index({ name: 'text', description: 'text', tags: 'text' });
foodSchema.index({ category: 1, isAvailable: 1 });
foodSchema.index({ price: 1 });
foodSchema.index({ 'rating.average': -1 });
foodSchema.index({ isBestseller: -1 });

export default mongoose.model('Food', foodSchema);
