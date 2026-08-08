import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Truck, UtensilsCrossed, MapPin, Star, Zap, Search } from 'lucide-react';
import { foodApi } from '../api';
import FoodCard from '../components/food/FoodCard';
import { SkeletonCard } from '../components/ui/Skeleton';

const FREE_DELIVERY = 299;
const STATS = [
  { value: '2.5k+', label: 'Happy customers', icon: Star },
  { value: '30 min', label: 'Avg. delivery', icon: Clock },
  { value: '150+', label: 'Dishes', icon: UtensilsCrossed },
];

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [featured, categories] = await Promise.all([foodApi.getFeatured(), foodApi.getCategories()]);
        setData({ featured: featured.data, categories: categories.data.categories });
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="overflow-x-clip">
      {/* ===== HERO ===== */}
      <section className="relative bg-brand-soft dark:bg-ink-900/40 noise">
        <div className="absolute inset-0 bg-mesh-dark animate-fade-in" aria-hidden />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl animate-pulse-soft" aria-hidden />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl animate-pulse-soft animation-delay-300" aria-hidden />

        <div className="container-app relative py-14 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-ink-900/60 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-ink-700 mb-6 shadow-sm animate-fade-in-up">
              <Zap size={14} className="text-brand-500" /> Fresh. Fast. Delicious.
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-ink-900 dark:text-white animate-fade-in-up animation-delay-150">
              Hungry? <span className="text-gradient">We've got you</span> covered.
            </h1>
            <p className="mt-5 text-lg text-ink-600 dark:text-ink-300 max-w-lg animate-fade-in-up delay-300">
              Order mouth-watering meals from the best kitchens and get them delivered to your doorstep in minutes.
            </p>

            {/* Search pill */}
            <form
              onSubmit={(e) => { e.preventDefault(); navigate(heroSearch.trim() ? `/menu?search=${encodeURIComponent(heroSearch.trim())}` : '/menu'); }}
              className="relative max-w-lg mt-8 animate-fade-in-up delay-500">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)} placeholder="Craving something? Search it now..." className="input pl-14 py-4 pr-40 rounded-2xl shadow-lg bg-white/80 dark:bg-ink-900/80 backdrop-blur border-0 focus:ring-brand-500/25" />
              <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 !py-2.5 text-sm">Explore</button>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-ink-600 dark:text-ink-300 animate-fade-in-up delay-500">
              <span className="flex items-center gap-2"><Clock size={18} className="text-brand-500" /> 30 min delivery</span>
              <span className="flex items-center gap-2"><Truck size={18} className="text-brand-500" /> Free delivery over ₹299 & on online payments</span>
              <span className="flex items-center gap-2"><MapPin size={18} className="text-brand-500" /> 2.5k+ restaurants</span>
            </div>
          </div>

          {/* Floating showcase */}
          <div className="hidden lg:flex relative items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-full bg-brand-400/30 blur-3xl absolute inset-0 animate-pulse-soft" aria-hidden />
          <img src="https://images.unsplash.com/photo-1547592180-85f173990554?w=600" alt="Gourmet burger" className="relative rounded-3xl shadow-float w-80 h-80 object-cover rotate-2 hover:rotate-0 transition-transform duration-500" />
          <img src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=300" alt="Pizza" className="absolute -left-16 top-6 w-28 h-28 rounded-2xl object-cover shadow-float border-4 border-white dark:border-ink-900 animate-float" />
          <img src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300" alt="Dessert" className="absolute -right-12 bottom-8 w-24 h-24 rounded-2xl object-cover shadow-float border-4 border-white dark:border-ink-900 animate-float animation-delay-500" />

              <div className="absolute -left-20 bottom-6 glass rounded-2xl px-4 py-3 shadow-float animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center"><Truck size={18} className="text-white" /></div>
                  <div>
                    <p className="text-xs text-ink-500">Arriving in</p>
                    <p className="font-bold text-ink-900 dark:text-white text-sm">≈ 25 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section className="container-app -mt-6 relative z-10">
        <div className="glass rounded-2xl px-6 py-4 grid grid-cols-3 gap-4 shadow-card border-t border-white/60">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center justify-center gap-3 text-center">
              <div className="hidden sm:flex h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 items-center justify-center"><s.icon size={20} className="text-brand-500" /></div>
              <div>
                <p className="font-display font-extrabold text-xl text-ink-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-xs text-ink-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="container-app py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest">Menu</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white mt-1">Browse by Category</h2>
          </div>
          <Link to="/categories" className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">{[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {data?.categories?.map((c) => (
              <Link key={c._id} to={`/menu?category=${c.slug}`}
                className="group card overflow-hidden rounded-2xl hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative aspect-[4/5]">
                <div className="absolute inset-0 overflow-hidden">
                  {c.image ? (
                    <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-ink-800 dark:to-ink-900 text-5xl">{c.icon}</div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5 group-hover:from-black/90 transition-colors duration-300" />
                <div className="relative flex flex-col justify-end items-center h-full p-3">
                  <span className="absolute top-2 right-2 bg-white/90 dark:bg-ink-900/80 text-ink-700 dark:text-ink-200 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur">{c.foodCount} items</span>
                  <span className="text-3xl mb-1 drop-shadow group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
                  <p className="font-bold text-sm text-white leading-tight drop-shadow">{c.name}</p>
                  <p className="text-[11px] text-white/80 mt-1 line-clamp-1 drop-shadow">{c.description || 'Delicious picks'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== BESTSELLERS ===== */}
      <section className="container-app py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest">Hand-picked</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white mt-1">Bestsellers <span className="inline-block">🔥</span></h2>
          </div>
          <Link to="/menu?sort=popular" className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {data?.featured?.bestsellers?.map((food) => <FoodCard key={food._id} food={food} />)}
          </div>
        )}
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="container-app py-12">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-widest">Simple</span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-white mt-1">How FoodHub works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Search, title: 'Explore & pick', desc: 'Browse thousands of dishes and add your favorites to the cart in one tap.' },
            { icon: Zap, title: 'We prepare fresh', desc: 'Kitchens cook it fresh, right when you order — quality you can taste.' },
            { icon: Truck, title: 'Fast doorstep delivery', desc: 'Your rider gets it to your door in ~30 minutes, track it live.' },
          ].map((s) => (
            <div key={s.title} className="relative card p-7 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 rounded-b-full bg-brand-gradient" />
              <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow mb-4 animate-fade-in-up"><s.icon size={24} /></div>
              <p className="text-sm font-bold text-brand-500 mb-1">{s.title}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="container-app py-12">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-8 lg:p-14 shadow-glow-lg noise">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" aria-hidden />
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="max-w-lg">
              <h2 className="font-display font-bold text-2xl lg:text-4xl leading-tight">Fresh food, delivered fast to your door.</h2>
              <p className="text-white/90 mt-3">Order now and get your favorites within 30 minutes — free delivery on orders over ₹{FREE_DELIVERY}, or pay online (UPI/Card) and delivery is always on us.</p>
            </div>
            <Link to="/menu" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-none rounded-xl hover:bg-orange-50 hover:scale-[1.03] transition-all shadow-lg shrink-0 group">
              Start Ordering <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}