import { NavLink, Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, TicketPercent, Package, Users, Star, Settings, ChevronLeft, Store, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/foods', label: 'Food Items', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Categories', icon: ShoppingBag },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/users', label: 'Customers', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function StoreLink() {
  return (
    <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-300 hover:bg-ink-800 hover:text-white transition-colors">
      <Store size={18} /> View Store
    </Link>
  );
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 bg-ink-900 dark:bg-ink-950 text-ink-300 sticky top-0 h-screen">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="font-display font-extrabold text-xl text-white">FoodHub</span>
          </Link>
          <p className="text-xs text-ink-500 mt-2 uppercase tracking-wide">Admin Panel</p>
        </div>
        <div className="px-3 pb-2 border-b border-ink-800">
          <StoreLink />
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-ink-800'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-ink-800">
          <div className="flex items-center gap-2 text-sm mb-2">
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">{user?.name?.charAt(0)}</div>
            <div className="min-w-0"><p className="text-white font-medium text-xs truncate">{user?.name}</p><p className="text-ink-400 text-[11px]">{user?.email}</p></div>
          </div>
          <Link to="/" className="flex items-center gap-1 text-xs text-ink-400 hover:text-white"><ChevronLeft size={14} /> Back to store</Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 bg-ink-900 text-white p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen((o) => !o)} className="p-2 rounded-lg hover:bg-ink-800" aria-label="Toggle admin menu">
              <Menu size={22} />
            </button>
            <span className="font-display font-bold">🍔 FoodHub Admin</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-white bg-ink-800 px-3 py-2 rounded-lg">
            <Store size={15} /> Store
          </Link>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-ink-900 text-ink-300 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-ink-800">
                <span className="font-display font-bold text-white">🍔 FoodHub Admin</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-ink-800" aria-label="Close menu"><X size={22} /></button>
              </div>
              <div className="p-3 border-b border-ink-800">
                <StoreLink />
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-ink-800'}`}>
                    <Icon size={18} /> {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
