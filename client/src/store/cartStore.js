import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],          // [{ food, quantity }]
      coupon: null,      // { code, discount }
      appliedCouponCode: '',

      addItem: (food, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.food._id === food._id);
        if (existing) {
          set({ items: items.map((i) => (i.food._id === food._id ? { ...i, quantity: i.quantity + quantity } : i)) });
        } else {
          set({ items: [...items, { food, quantity }] });
        }
      },

      removeItem: (foodId) => set({ items: get().items.filter((i) => i.food._id !== foodId), coupon: null, appliedCouponCode: '' }),

      updateQuantity: (foodId, quantity) => {
        if (quantity <= 0) return get().removeItem(foodId);
        set({ items: get().items.map((i) => (i.food._id === foodId ? { ...i, quantity } : i)) });
      },

      clearCart: () => set({ items: [], coupon: null, appliedCouponCode: '' }),

      setCoupon: (coupon) => set({ coupon }),

      getSubtotal: () => get().items.reduce((sum, i) => {
        const price = i.food.discountPrice != null && i.food.discountPrice < i.food.price ? i.food.discountPrice : i.food.price;
        return sum + price * i.quantity;
      }, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      // Returns items formatted for API checkout
      getCheckoutItems: () => get().items.map((i) => ({ food: i.food._id, quantity: i.quantity })),
    }),
    {
      // sessionStorage keeps the cart per browser tab — so the user, admin and
      // delivery accounts each keep their own cart (user's pizza never appears
      // in the delivery boy's cart, etc.)
      name: 'foodhub-cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default useCartStore;
