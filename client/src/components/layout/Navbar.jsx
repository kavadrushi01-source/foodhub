import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Heart, User, Menu, LogOut, Package, LayoutDashboard, Bike, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/categories', label: 'Categories' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useAuthStore((s) => s.wishlist.length);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleCartDrawer = useUIStore((s) => s.toggleCartDrawer);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/menu?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'glass shadow-card' : 'bg-cream/60 dark:bg-ink-950/40 backdrop-blur-lg border-b border-transparent'}`}>
      <nav className="container-app flex items-center justify-between h-16 gap-3">
        <button onClick={toggleSidebar} className="lg:hidden p-2 -ml-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100/80 dark:hover:bg-ink-800 rounded-lg" aria-label="Open menu">
          <Menu size={22} />
        </button>

        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center text-xl shadow-glow group-hover:rotate-6 transition-transform duration-300">🍔</span>
          <span className="font-display font-extrabold text-xl tracking-tight text-ink-900 dark:text-white">
            Food<span className="text-gradient">Hub</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-100/80 dark:hover:bg-ink-800'}`}>
              {l.label}
            </Link>
          ))}
          {isAuthenticated && (user?.role === 'admin' || user?.role === 'delivery') && (
            <Link to={user?.role === 'admin' ? '/admin' : '/delivery'}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold transition-colors ${String(location.pathname).startsWith(user?.role === 'admin' ? '/admin' : '/delivery') ? 'text-white bg-brand-gradient shadow-glow' : 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}>
              {user?.role === 'admin' ? <LayoutDashboard size={16} /> : <Bike size={16} />}
              Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'user' && (
            <Link to="/orders"
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold transition-colors ${String(location.pathname).startsWith('/orders') ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-100/80 dark:hover:bg-ink-800'}`}>
              <Package size={16} /> My Orders
            </Link>
          )}
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4">
          <div className="relative w-full group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 group-focus-within:text-brand-500 transition-colors" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for burgers, pizza, biryani..." className="input pl-10 py-2 rounded-full bg-white/70 dark:bg-ink-900/70" aria-label="Search foods" />
          </div>
        </form>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <ThemeToggle />
          {isAuthenticated && (
            <Link to="/wishlist" className="relative p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100/80 dark:hover:bg-ink-800 rounded-lg transition-colors" aria-label="Wishlist">
              <Heart size={22} />
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-gradient text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center shadow">{wishlistCount}</span>}
            </Link>
          )}
          <button onClick={toggleCartDrawer} className="relative p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100/80 dark:hover:bg-ink-800 rounded-lg transition-colors" aria-label="Cart">
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-gradient text-white text-[10px] font-bold rounded-full h-[18px] w-[18px] flex items-center justify-center shadow">{itemCount}</span>}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-ink-100/80 dark:hover:bg-ink-800 transition-colors" aria-label="Account menu">
                <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow">{user?.name?.charAt(0).toUpperCase()}</div>
                <ChevronDown size={16} className={`hidden sm:block text-ink-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 card p-2 animate-fade-in-up z-20 shadow-float" role="menu">
                    <div className="px-3 py-2.5 border-b border-ink-100 dark:border-ink-800 mb-1">
                      <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">{user?.name}</p>
                      <p className="text-xs text-ink-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <MenuItem to="/profile" icon={User} label="My Profile" />
                    <MenuItem to="/orders" icon={Package} label="My Orders" />
                    {user?.role === 'admin' && <MenuItem to="/admin" icon={LayoutDashboard} label="Admin Dashboard" />}
                    {user?.role === 'delivery' && <MenuItem to="/delivery" icon={Bike} label="Delivery Dashboard" />}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Link to="/login" className="btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search foods..." className="input pl-10 py-2 rounded-full" aria-label="Search foods" />
        </div>
      </form>
    </header>
  );
}

function MenuItem({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-ink-700 dark:text-ink-200 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors" role="menuitem">
      <Icon size={16} /> {label}
    </Link>
  );
}
