import { Link } from 'react-router-dom';
import { X, Home, UtensilsCrossed, Heart, ShoppingBag, Package, User, LayoutDashboard, Bike, Phone } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/categories', label: 'Categories', icon: ShoppingBag },
  { to: '/wishlist', label: 'Wishlist', icon: Heart, auth: true },
  { to: '/orders', label: 'My Orders', icon: Package, auth: true, role: 'user' },
  { to: '/profile', label: 'Profile', icon: User, auth: true },
];

export default function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();

  if (!sidebarOpen) return null;

  const filtered = links.filter((l) => (!l.auth || isAuthenticated) && (!l.role || user?.role === l.role));

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-ink-900 shadow-2xl flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-ink-800">
          <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center text-xl shadow-glow">🍔</span>
            <span className="font-display font-extrabold text-xl text-ink-900 dark:text-white">Food<span className="text-gradient">Hub</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filtered.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-3 py-3 rounded-xl text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 font-medium">
              <Icon size={20} /> {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium">
              <LayoutDashboard size={20} /> Admin Dashboard
            </Link>
          )}
          {user?.role === 'delivery' && (
            <Link to="/delivery" className="flex items-center gap-3 px-3 py-3 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-medium">
              <Bike size={20} /> Delivery Dashboard
            </Link>
          )}
        </nav>
        {!isAuthenticated ? (
          <div className="p-4 border-t border-ink-100 dark:border-ink-800 space-y-2">
            <Link to="/login" onClick={() => setSidebarOpen(false)} className="btn-secondary w-full">Login</Link>
            <Link to="/register" onClick={() => setSidebarOpen(false)} className="btn-primary w-full">Sign Up</Link>
          </div>
        ) : (
          <div className="p-4 border-t border-ink-100 dark:border-ink-800 flex items-center gap-2 text-sm text-ink-500">
            <Phone size={15} /> Need help? +91 98765 43210
          </div>
        )}
      </aside>
    </div>
  );
}
