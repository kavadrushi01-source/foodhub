import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileSidebar from './MobileSidebar';
import CartDrawer from './CartDrawer';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

export default function Layout() {
  const theme = useUIStore((s) => s.theme);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isLoading = useAuthStore((s) => s.isLoading);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <MobileSidebar />
      <CartDrawer />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
