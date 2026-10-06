import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileSidebar from './MobileSidebar';
import CartDrawer from './CartDrawer';
import ChatWidget from '../chat/ChatWidget';
import RouteFallback from '../ui/RouteFallback';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

/**
 * Warm the lazy chunks for the routes users visit most while the browser is
 * idle. React.lazy caches the module promise, so when the user later clicks
 * Menu / Cart / … the navigation resolves instantly instead of flashing the
 * route spinner. Auth-only pages are prefetched just for signed-in users.
 */
function prefetchRoutes() {
  const loads = [
    import('../../pages/Menu'),
    import('../../pages/Cart'),
    import('../../pages/Categories'),
    import('../../pages/FoodDetail'),
    import('../../pages/auth/Login'),
  ];
  if (useAuthStore.getState().isAuthenticated) {
    loads.push(import('../../pages/Orders'), import('../../pages/Checkout'));
  }
  Promise.all(loads).catch(() => { /* prefetch is best-effort */ });
}

export default function Layout() {
  const theme = useUIStore((s) => s.theme);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { pathname } = useLocation();

  // Apply theme class on mount
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Fetch current user on mount (only if not already fetched)
  useEffect(() => {
    if (isLoading) {
      fetchMe();
    }
  }, [fetchMe, isLoading]);

  // SPA route change: jump to the top like a full page load would. The
  // temporary scroll-behavior override keeps `html { scroll-behavior: smooth }`
  // from animating a long journey up a tall page (that feels like lag).
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }, [pathname]);

  // Idle-warm the common route chunks (see prefetchRoutes).
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetchRoutes, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MobileSidebar />
      <CartDrawer />
      <ChatWidget />
      {/* Suspense INSIDE the layout so route changes only swap <main> —
          Navbar/Footer stay mounted instead of the whole page flashing a spinner. */}
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
