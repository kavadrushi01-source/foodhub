import { Link } from 'react-router-dom';
import { Heart, Plus, Star, Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { foodApi } from '../../api';
import { formatCurrency, getEffectivePrice } from '../../utils/format';
import { imgFallback } from '../../utils/imageFallback';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

export default function FoodCard({ food }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleCartDrawer = useUIStore((s) => s.toggleCartDrawer);
  const { isAuthenticated, toggleWishlistLocal, wishlist } = useAuthStore();
  const inWishlist = wishlist.includes(food._id);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    addItem(food, 1); toggleCartDrawer();
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
    toast.success(`${food.name} added to cart`);
  };

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to save to wishlist'); return; }
    toggleWishlistLocal(food._id);
    try { await foodApi.toggleWishlist(food._id); } catch {}
  };

  const discountPercent = food.discountPrice && food.discountPrice < food.price
    ? Math.round(((food.price - food.discountPrice) / food.price) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}
      className="card group overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link to={`/food/${food.slug}`} className="block relative">
        <div className="relative h-48 overflow-hidden bg-ink-100 dark:bg-ink-800">
          <img src={food.primaryImage || food.images?.[0]} alt={food.name} loading="lazy" onError={imgFallback} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discountPercent > 0 && <Badge tone="red" className="font-bold shadow-sm">-{discountPercent}%</Badge>}
            {food.isBestseller && <Badge tone="brand">⭐ Bestseller</Badge>}
            {food.isNewArrival && <Badge tone="green">NEW</Badge>}
          </div>
          <span className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-full flex items-center justify-center shadow ${food.isVeg ? 'bg-green-500' : 'bg-red-500'}`} title={food.isVeg ? 'Vegetarian' : 'Non-veg'}>
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <div className="absolute bottom-2.5 left-2.5">
            {food.rating?.average > 0 && (
              <span className="inline-flex items-center gap-1 bg-black/50 backdrop-blur text-white text-xs font-semibold px-2 py-1 rounded-full">
                <Star size={12} className="fill-amber-400 text-amber-400" /> {food.rating.average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/food/${food.slug}`}>
          <h3 className="font-semibold text-ink-800 dark:text-ink-100 line-clamp-1 hover:text-brand-600 transition-colors">{food.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-400">
          <span className="flex items-center gap-1"><Clock size={12} /> {food.prepTime} min</span>
          {food.categoryName && <span className="text-ink-300 dark:text-ink-600">•</span>}
          {food.categoryName && <span>{food.categoryName}</span>}
        </div>
        <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2 mt-1.5 flex-1">{food.shortDescription || food.description}</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-100 dark:border-ink-800">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-bold text-lg text-ink-900 dark:text-white">{formatCurrency(getEffectivePrice(food))}</span>
            {discountPercent > 0 && <span className="text-xs text-ink-400 line-through">{formatCurrency(food.price)}</span>}
          </div>
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <button onClick={handleWishlist} className={`p-2 rounded-lg transition-colors ${inWishlist ? 'text-red-500' : 'text-ink-400 hover:text-red-500 hover:bg-ink-100 dark:hover:bg-ink-800'}`} aria-label="Toggle wishlist">
                <Heart size={18} className={inWishlist ? 'fill-red-500' : ''} />
              </button>
            )}
            <button onClick={handleAdd} aria-label={`Add ${food.name} to cart`}
              className={`grid place-items-center h-9 w-9 rounded-xl transition-all duration-300 active:scale-90 ${
                added ? 'bg-green-500 text-white' : 'bg-brand-gradient text-white shadow-glow hover:scale-105'}`}>
              <motion.span key={added ? 'added' : 'add'} initial={{ scale: 0.6, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
                {added ? <Check size={18} /> : <Plus size={18} />}
              </motion.span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}