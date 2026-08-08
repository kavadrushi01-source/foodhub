import mongoose from 'mongoose';

// Singleton settings doc for global store config (delivery charges, etc.)
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'store' },
    storeName: { type: String, default: 'FoodHub' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },

    delivery: {
      baseCharge: { type: Number, default: 30 },
      perKmCharge: { type: Number, default: 5 },
      freeDeliveryThreshold: { type: Number, default: 299 },
      freeDeliveryViaOnlinePayment: { type: Boolean, default: true },
      freeDeliveryMessage: { type: String, default: 'Free delivery on online payments & orders above ₹299' },
      maxDeliveryRadiusKm: { type: Number, default: 10 },
      estimatedPrepTimeMin: { type: Number, default: 15 },
      estimatedDeliveryTimeMin: { type: Number, default: 30 },
    },
    charges: {
      packagingCharge: { type: Number, default: 0 },
      taxPercent: { type: Number, default: 0 }, // GST % on subtotal
      serviceChargePercent: { type: Number, default: 0 },
    },
    features: {
      codEnabled: { type: Boolean, default: true },
      razorpayEnabled: { type: Boolean, default: true },
      stripeEnabled: { type: Boolean, default: false },
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    social: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

settingsSchema.statics.getSettings = async function () {
  let s = await this.findOne({ key: 'store' });
  if (!s) s = await this.create({ key: 'store' });
  return s;
};

export default mongoose.model('Settings', settingsSchema);
