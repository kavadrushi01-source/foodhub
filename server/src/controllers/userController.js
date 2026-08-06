import User from '../models/User.js';
import Food from '../models/Food.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { round2 } from '../utils/helpers.js';

// ============ ADDRESSES ============

export const getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id);
  return res.status(200).json({ success: true, status: 200, data: { addresses: user.addresses } });
};

export const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  if (user.addresses.length === 1) user.addresses[0].isDefault = true;
  await user.save();
  return res.status(201).json({ success: true, status: 201, message: 'Address added', data: { addresses: user.addresses } });
};

export const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) throw new NotFoundError('Address not found');
  Object.assign(addr, req.body);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { if (a._id.toString() !== req.params.id) a.isDefault = false; });
  }
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Address updated', data: { addresses: user.addresses } });
};

export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.id);
  if (!addr) throw new NotFoundError('Address not found');
  user.addresses.pull(req.params.id);
  if (addr.isDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Address removed', data: { addresses: user.addresses } });
};

export const setDefaultAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.forEach((a) => (a.isDefault = a._id.toString() === req.params.id));
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: 'Default address set', data: { addresses: user.addresses } });
};

// ============ WISHLIST ============

export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  return res.status(200).json({ success: true, status: 200, data: { wishlist: user.wishlist } });
};

export const toggleWishlist = async (req, res) => {
  const { foodId } = req.params;
  const food = await Food.findById(foodId);
  if (!food) throw new NotFoundError('Food not found');
  const user = await User.findById(req.user._id);
  const idx = user.wishlist.findIndex((id) => id.toString() === foodId);
  let inWishlist = false;
  if (idx === -1) { user.wishlist.push(foodId); inWishlist = true; }
  else { user.wishlist.splice(idx, 1); inWishlist = false; }
  await user.save();
  return res.status(200).json({ success: true, status: 200, message: inWishlist ? 'Added to wishlist' : 'Removed from wishlist', data: { inWishlist, wishlistCount: user.wishlist.length } });
};

// ============ ORDER HISTORY / TRACKING (user-facing) ============

export { getMyOrders, getOrderForUser } from './orderController.js';
