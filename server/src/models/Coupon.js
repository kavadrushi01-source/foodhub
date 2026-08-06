import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', maxlength: 200 },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // for percentage type
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
  },
  { timestamps: true },
);

couponSchema.methods.isValid = function (orderTotal, userUsageCount = 0) {
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  const now = new Date();
  if (this.startDate && now < this.startDate) return { valid: false, message: 'Coupon not yet active' };
  if (this.endDate && now > this.endDate) return { valid: false, message: 'Coupon has expired' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, message: 'Coupon usage limit reached' };
  if (this.perUserLimit && userUsageCount >= this.perUserLimit) return { valid: false, message: 'You have used this coupon already' };
  if (orderTotal < this.minOrder) return { valid: false, message: `Minimum order ₹${this.minOrder} required` };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderTotal) {
  let discount = 0;
  if (this.type === 'percentage') {
    discount = (orderTotal * this.value) / 100;
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else {
    discount = this.value;
  }
  return Math.min(discount, orderTotal);
};

export default mongoose.model('Coupon', couponSchema);
