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
      <h1 className="font-display font-bold text-3xl text-ink-900 dark:text-ink-100 mb-2">Browse Categories</h1>
      <p className="text-ink-500 dark:text-ink-400 mb-8">Explore our delicious menu by category</p>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : categories?.length === 0 ? (
        <EmptyState title="No categories yet" description="Categories will appear here soon." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link key={c._id} to={`/menu?category=${c.slug}`} className="card p-6 text-center hover:shadow-card-hover transition-all group">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
              <h2 className="font-semibold text-lg text-ink-800 dark:text-ink-100">{c.name}</h2>
              <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 line-clamp-2">{c.description}</p>
              <span className="inline-flex items-center gap-1 text-brand-600 text-sm font-medium mt-3 group-hover:gap-2 transition-all">Explore <ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
