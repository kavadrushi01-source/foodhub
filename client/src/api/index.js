import api from './axios.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.patch('/auth/profile', data),
  getOAuthProviders: () => api.get('/auth/providers'),
  exchangeOAuth: (code) => api.post('/auth/oauth/exchange', { code }),
};

// Relative in dev (Vite proxies /api); absolute in production when
// VITE_API_URL points at a separate API domain.
export const getOAuthUrl = (provider) => `${import.meta.env.VITE_API_URL || '/api'}/auth/${provider}`;

export const foodApi = {
  getFeatured: () => api.get('/featured'),
  getCategories: () => api.get('/categories'),
  getFoods: (params) => api.get('/foods', { params }),
  getFoodBySlug: (slug) => api.get(`/foods/${slug}`),
  getReviews: (foodId, params) => api.get(`/reviews/${foodId}`, { params }),
  addReview: (data) => api.post('/reviews', data),
  markReviewHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (foodId) => api.post(`/wishlist/${foodId}`),
  getAddresses: () => api.get('/addresses'),
  addAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.patch(`/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/addresses/${id}/default`),
};

export const orderApi = {
  preview: (data) => api.post('/orders/preview', data),
  applyCoupon: (data) => api.post('/orders/coupon/apply', data),
  create: (data) => api.post('/orders', data),
  confirmPayment: (orderId, data) => api.post(`/orders/${orderId}/payment/confirm`, data),
  getMyOrders: (params) => api.get('/orders/me', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getRevenue: (days) => api.get('/admin/revenue', { params: { days } }),
  getTopFoods: () => api.get('/admin/top-foods'),
  getCategoryStats: () => api.get('/admin/category-stats'),
  getFoods: (params) => api.get('/admin/foods', { params }),
  createFood: (data) => api.post('/admin/foods', data),
  updateFood: (id, data) => api.patch(`/admin/foods/${id}`, data),
  deleteFood: (id) => api.delete(`/admin/foods/${id}`),
  updateStock: (id, stock) => api.patch(`/admin/foods/${id}/stock`, { stock }),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  updateItemStatus: (orderId, itemId, data) => api.patch(`/admin/orders/${orderId}/items/${itemId}/status`, data),
  assignDelivery: (id, data) => api.post(`/admin/orders/${id}/assign`, data),
  refundOrder: (id, reason) => api.post(`/admin/orders/${id}/refund`, { reason }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  getReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.patch('/admin/settings', data),
};

export const deliveryApi = {
  getDeliveries: (params) => api.get('/delivery/deliveries', { params }),
  getEarnings: () => api.get('/delivery/earnings'),
  getOrder: (id) => api.get(`/delivery/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/delivery/orders/${id}/status`, data),
  verifyOtp: (id, otp) => api.post(`/delivery/orders/${id}/verify-otp`, { otp }),
};

export const paymentApi = {
  getConfig: () => api.get('/payments/config'),
  createOrder: (orderId) => api.post('/payments/order', { orderId }),
  verify: (data) => api.post('/payments/verify', data),
};

export const chatApi = {
  ask: (message) => api.post('/chatbot/ask', { message }),
};
