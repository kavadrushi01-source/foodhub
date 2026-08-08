import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { foodApi } from '../api';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function Categories() {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await foodApi.getCategories();
        setCategories(res.data.categories);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-ink-900 dark:text-ink-100 mb-2">Browse Categories</h1>
        <p className="text-ink-500 dark:text-ink-400">Explore our delicious menu by category — from street food to fine sushi</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : categories?.length === 0 ? (
        <EmptyState title="No categories yet" description="Categories will appear here soon." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link key={c._id} to={`/menu?category=${c.slug}`} className="group card overflow-hidden rounded-2xl hover:shadow-card-hover hover:-translate-y-1 transition-all">
              <div className="relative h-32 sm:h-40 overflow-hidden">
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-ink-800 dark:to-ink-900 text-6xl">{c.icon}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <span className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-ink-900/90 text-ink-700 dark:text-ink-200 text-xs font-semibold px-2.5 py-1 rounded-full shadow">{c.foodCount} items</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-lg text-ink-800 dark:text-ink-100 truncate">{c.icon} {c.name}</h2>
                </div>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 line-clamp-2">{c.description}</p>
                <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 text-sm font-medium mt-3 group-hover:gap-2 transition-all">Explore <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}