import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: false,
      cartDrawerOpen: false,

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          if (next === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setCartDrawer: (open) => set({ cartDrawerOpen: open }),
      toggleCartDrawer: () => set({ cartDrawerOpen: !get().cartDrawerOpen }),
    }),
    {
      name: 'foodhub-ui',
      // Persist ONLY the theme. sidebarOpen/cartDrawerOpen are transient UI
      // flags — saving them meant a drawer left open when the tab closed
      // sprang back open (with its animation) on the next visit.
      partialize: (s) => ({ theme: s.theme }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted || {}),
        sidebarOpen: false,
        cartDrawerOpen: false,
      }),
    },
  ),
);

export default useUIStore;
