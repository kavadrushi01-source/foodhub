import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateToken, hashToken } from '../utils/token.js';

const ROLES = ['user', 'admin', 'delivery'];

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
  },
  { timestamps: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    avatar: { type: String, default: '' },

    // OAuth providers
    provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    googleId: { type: String, default: null, sparse: true },
    facebookId: { type: String, default: null, sparse: true },

    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    addresses: { type: [addressSchema], default: [] },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],

    // Delivery partner specific
    deliveryProfile: {
      vehicleNumber: { type: String, default: '' },
      vehicleType: { type: String, enum: ['bike', 'scooter', 'car', 'cycle'], default: 'bike' },
      isOnline: { type: Boolean, default: false },
      currentLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
      totalEarnings: { type: Number, default: 0 },
      totalDeliveries: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
    },

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true },
);

// Hash password on save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance methods
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Set email verification token (returns the raw token to send via email)
userSchema.methods.setEmailVerificationToken = function () {
  const raw = generateToken(32);
  this.emailVerificationToken = hashToken(raw);
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return raw;
};

userSchema.methods.setPasswordResetToken = function () {
  const raw = generateToken(32);
  this.passwordResetToken = hashToken(raw);
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15m
  return raw;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

userSchema.index({ role: 1 });

export const ROLES_LIST = ROLES;
export default mongoose.model('User', userSchema);
