import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', maxlength: 120 },
    comment: { type: String, default: '', maxlength: 2000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
    reportedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

reviewSchema.index({ food: 1, user: 1 }, { unique: true });
reviewSchema.index({ rating: -1 });

export default mongoose.model('Review', reviewSchema);
