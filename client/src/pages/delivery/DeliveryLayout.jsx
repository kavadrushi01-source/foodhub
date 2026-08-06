import { NavLink, Outlet, Link } from 'react-router-dom';
import { Bike, LayoutDashboard, Package, ChevronLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/delivery', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/delivery/orders', label: 'All Orders', icon: Package },
];

export default function DeliveryLayout() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex flex-col w-60 bg-ink-900 dark:bg-ink-950 text-ink-300 sticky top-0 h-screen">
        <div className="p-5">
          <div className="flex items-center gap-2"><span className="text-2xl">🛵</span><span className="font-display font-extrabold text-xl text-white">FoodHub</span></div>
          <p className="text-xs text-ink-500 mt-2 uppercase tracking-wide">Delivery Partner</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-ink-800'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-ink-800">
          <div className="flex items-center gap-2 text-sm mb-3">
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold"><Bike size={16} /></div>
            <div className="min-w-0"><p className="text-white font-medium text-xs truncate">{user?.name}</p><p className="text-ink-400 text-[11px]">{user?.deliveryProfile?.vehicleType || 'partner'}</p></div>
          </div>
          <Link to="/" className="flex items-center gap-1 text-xs text-ink-400 hover:text-white"><ChevronLeft size={14} /> Back to store</Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-30 bg-ink-900 text-white p-4 flex items-center gap-3"><Link to="/" className="font-display font-bold">🛵 FoodHub Partner</Link></div>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
