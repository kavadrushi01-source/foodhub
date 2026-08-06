import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { foodApi } from '../api';
import useAuthStore from '../store/authStore';
import FoodCard from '../components/food/FoodCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toggleWishlistLocal } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try {
      const res = await foodApi.getWishlist();
      setItems(res.data.wishlist);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    toggleWishlistLocal(id);
    setItems((prev) => prev.filter((f) => f._id !== id));
    try { await foodApi.toggleWishlist(id); } catch {}
  };

  return (
    <div className="container-app py-10">
      <h1 className="font-display font-bold text-3xl text-ink-900 dark:text-ink-100 mb-8">My Wishlist</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save your favorite dishes here and come back to order them anytime."
          action={<Link to="/menu" className="btn-primary">Browse Menu</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((food) => (
            <div key={food._id} className="relative">
              <FoodCard food={food} />
              <button onClick={() => handleRemove(food._id)} className="absolute top-14 right-3 p-2 rounded-full bg-white/90 dark:bg-ink-800/90 shadow text-red-500 hover:scale-110 transition-transform" aria-label="Remove from wishlist">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
