import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { foodApi } from '../api';
import FoodCard from '../components/food/FoodCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const isVeg = params.get('isVeg') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const loadCategories = async () => {
    try { const res = await foodApi.getCategories(); setCategories(res.data.categories); } catch {}
  };

  const loadFoods = async () => {
    setLoading(true);
    const query = { page, limit: 12, sort };
    if (search) query.search = search;
    if (category) query.category = category;
    if (isVeg) query.isVeg = isVeg;
    try {
      const res = await foodApi.getFoods(query);
      setFoods(res.data.items);
      setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadFoods(); }, [search, category, isVeg, sort, page]);

  const heading = category ? categories.find((c) => c.slug === category)?.name || 'Menu' : search ? `Results for "${search}"` : 'Our Menu';

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink-900 dark:text-white">
              {heading} {!category && !search && <span className="text-gradient">🥘</span>}
            </h1>
            <p className="text-ink-500 dark:text-ink-400 text-sm mt-1">{meta?.total ? `${meta.total} items` : 'Fresh food, fast delivery'}</p>
          </div>
          <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary sm:hidden self-start"><SlidersHorizontal size={16} /> Filters</button>
        </div>
        {/* Sort pills (desktop) */}
        {!search && (
          <div className="hidden sm:flex items-center gap-2 mt-4 flex-wrap">
            {SORTS.map((s) => (
              <button key={s.value} onClick={() => updateParam('sort', s.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${sort === s.value ? 'bg-brand-gradient text-white border-transparent shadow-glow' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-400'}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Category chips — scrollable on mobile, picky premium look */}
        {categories.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mt-4 -mx-1 px-1 pb-1 hide-scrollbar">
            <button onClick={() => updateParam('category', '')}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${!category ? 'bg-brand-gradient text-white border-transparent shadow-glow' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-400'}`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c._id} onClick={() => updateParam('category', c.slug)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${category === c.slug ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-transparent shadow-glow' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-400'}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6">
        <aside className={`card p-5 h-fit lg:sticky lg:top-24 ${showFilters ? 'block animate-fade-in' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2"><SlidersHorizontal size={16} className="text-brand-500" /> Filters</h2>
            <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 text-ink-400 hover:text-brand-500 transition-colors" aria-label="Close filters"><X size={18} /></button>
          </div>
          <FilterGroup title="Category">
            <div className="space-y-1">
              <FilterRow active={!category} onClick={() => updateParam('category', '')}>All</FilterRow>
              {categories.map((c) => (
                <FilterRow key={c._id} active={category === c.slug} onClick={() => updateParam('category', c.slug)}>{c.icon} {c.name}</FilterRow>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Dietary">
            <FilterRow active={!isVeg} onClick={() => updateParam('isVeg', '')}>All</FilterRow>
            <FilterRow active={isVeg === 'true'} onClick={() => updateParam('isVeg', 'true')}>🟢 Vegetarian</FilterRow>
            <FilterRow active={isVeg === 'false'} onClick={() => updateParam('isVeg', 'false')}>🔴 Non-Veg</FilterRow>
          </FilterGroup>

          <FilterGroup title="Sort by">
            <div className="space-y-1">
              {SORTS.map((s) => (
                <FilterRow key={s.value} active={sort === s.value} onClick={() => updateParam('sort', s.value)}>{s.label}</FilterRow>
              ))}
            </div>
          </FilterGroup>
        </aside>

        {/* Food grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : foods.length === 0 ? (
            <EmptyState title="No items found" description="No foods match your current filters. Try adjusting your search." />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                {foods.map((food) => <FoodCard key={food._id} food={food} />)}
              </div>
              {meta && meta.totalPages > 1 && <Pagination meta={meta} onPage={(p) => updateParam('page', String(p))} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function FilterRow({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${active ? 'bg-brand-gradient text-white font-medium shadow-glow' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}>
      {children}
    </button>
  );
}