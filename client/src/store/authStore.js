import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api';
import useCartStore from './cartStore';
import { setTokens, getAccessToken, clearTokens } from '../utils/authStorage';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      _fetching: false, // Prevent concurrent fetchMe calls
      wishlist: [],

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (credentials) => {
        const res = await authApi.login(credentials);
        const { user, tokens } = res.data;
        setTokens(tokens, !!credentials.rememberMe);
        useCartStore.getState().clearCart();
        set({ user, isAuthenticated: true, isLoading: false, _fetching: false, wishlist: user.wishlist || [] });
        return res;
      },

      register: async (data) => {
        const res = await authApi.register(data);
        const { user, tokens } = res.data;
        setTokens(tokens, false);
        useCartStore.getState().clearCart();
        set({ user, isAuthenticated: true, isLoading: false, _fetching: false });
        return res;
      },

      // Login via social OAuth (handoff code already exchanged on server side)
      oauthLogin: async (res) => {
        const { user, tokens } = res.data;
        setTokens(tokens, true);
        useCartStore.getState().clearCart();
        set({ user, isAuthenticated: true, isLoading: false, _fetching: false, wishlist: user.wishlist || [] });
        return res;
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        clearTokens();
        useCartStore.getState().clearCart();
        set({ user: null, isAuthenticated: false, isLoading: false, _fetching: false, wishlist: [] });
      },

      fetchMe: async () => {
        // Prevent concurrent calls
        if (get()._fetching || !get().isLoading) return;

        // No credentials -> already logged out, don't hit the API (avoids 401 redirect noise)
        if (!getAccessToken()) {
          set({ user: null, isAuthenticated: false, isLoading: false, _fetching: false });
          return;
        }

        set({ _fetching: true });
        try {
          const res = await authApi.me();
          set({ user: res.data.user, isAuthenticated: true, wishlist: res.data.user.wishlist || [], isLoading: false, _fetching: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false, _fetching: false });
        }
      },

      updateProfile: async (data) => {
        const res = await authApi.updateProfile(data);
        set({ user: res.data.user });
        return res;
      },

      toggleWishlistLocal: (foodId) => {
        const wishlist = get().wishlist;
        const idx = wishlist.indexOf(foodId);
        if (idx === -1) set({ wishlist: [...wishlist, foodId] });
        else set({ wishlist: wishlist.filter((id) => id !== foodId) });
      },

      isAdmin: () => get().user?.role === 'admin',
      isDelivery: () => get().user?.role === 'delivery',
    }),
    {
      name: 'foodhub-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ wishlist: state.wishlist }),
    },
  ),
);

export default useAuthStore;
