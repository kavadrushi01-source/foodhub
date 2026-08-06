import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Plus, Minus, Clock, ChevronRight, Leaf, Flame, Droplets } from 'lucide-react';
import { foodApi } from '../api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { formatCurrency, getEffectivePrice } from '../utils/format';
import { imgFallback } from '../utils/imageFallback';
import Skeleton from '../components/ui/Skeleton';
import Rating from '../components/ui/Rating';
import Badge from '../components/ui/Badge';
import FoodCard from '../components/food/FoodCard';
import toast from 'react-hot-toast';

export default function FoodDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated, toggleWishlistLocal, wishlist } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try {
      const res = await foodApi.getFoodBySlug(slug);
      setData(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [slug]);

  if (loading) return <FoodDetailSkeleton />;
  if (!data) {
    return (
      <div className="container-app py-16 text-center">
        <h1 className="text-xl font-semibold">Food not found</h1>
        <Link to="/menu" className="btn-primary mt-4">Back to Menu</Link>
      </div>
    );
  }

  const { food, reviews, related } = data;
  const inWishlist = wishlist.includes(food._id);

  const handleAdd = () => {
    addItem(food, quantity);
    toast.success('Added to cart');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login'); return; }
    toggleWishlistLocal(food._id);
    try { await foodApi.toggleWishlist(food._id); } catch {}
  };

  const discountPercent = food.discountPrice && food.discountPrice < food.price ? Math.round(((food.price - food.discountPrice) / food.price) * 100) : 0;

  return (
    <div className="container-app py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-ink-500 dark:text-ink-400 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <Link to="/menu" className="hover:text-brand-600">Menu</Link>
        <ChevronRight size={14} />
        <span className="text-ink-800 dark:text-ink-100 font-medium truncate">{food.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card overflow-hidden h-fit">
          <div className="relative aspect-square overflow-hidden bg-ink-100 dark:bg-ink-800">
            <img src={food.primaryImage || food.images?.[0]} alt={food.name} onError={imgFallback} className="h-full w-full object-cover" loading="eager" />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discountPercent > 0 && <Badge tone="red" className="font-bold">-{discountPercent}%</Badge>}
              {food.isBestseller && <Badge tone="brand">⭐ Bestseller</Badge>}
            </div>
            <span className={`absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center ${food.isVeg ? 'bg-green-500' : 'bg-red-500'}`} title={food.isVeg ? 'Vegetarian' : 'Non-veg'}>
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="font-display font-extrabold text-3xl text-ink-900 dark:text-ink-100">{food.name}</h1>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <Rating value={food.rating?.average || 0} count={food.rating?.count} showCount />
            <span className="flex items-center gap-1 text-ink-500 dark:text-ink-400 text-sm"><Clock size={16} /> {food.prepTime} min</span>
            <Badge tone="gray">{food.cuisine}</Badge>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-bold text-3xl text-brand-600 dark:text-brand-400">{formatCurrency(getEffectivePrice(food))}</span>
            {discountPercent > 0 && <span className="text-lg text-ink-400 line-through">{formatCurrency(food.price)}</span>}
          </div>

          <p className="mt-5 text-ink-600 dark:text-ink-300 leading-relaxed">{food.description}</p>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-ink-200 dark:border-ink-700 rounded-xl overflow-hidden">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-3 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Decrease quantity"><Minus size={18} /></button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="p-3 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Increase quantity"><Plus size={18} /></button>
            </div>
            <button onClick={handleAdd} className="btn-primary !px-8 !py-3">Add to Cart • {formatCurrency(getEffectivePrice(food) * quantity)}</button>
            <button onClick={handleWishlist} className={`btn-secondary !px-3 !py-3 ${inWishlist ? 'text-red-500' : ''}`} aria-label="Toggle wishlist">
              <Heart size={20} className={inWishlist ? 'fill-red-500' : ''} />
            </button>
          </div>

          {/* Nutrition */}
          {(food.nutrition?.calories || food.ingredients?.length) && (
            <div className="card mt-8 p-5">
              <h2 className="font-display font-bold text-lg mb-4">Nutrition Facts</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <NutriStat icon={Flame} label="Calories" value={`${food.nutrition?.calories || 0} kcal`} />
                <NutriStat icon={Droplets} label="Protein" value={`${food.nutrition?.protein || 0} g`} />
                <NutriStat label="Carbs" value={`${food.nutrition?.carbs || 0} g`} emoji="🍞" />
                <NutriStat label="Fat" value={`${food.nutrition?.fat || 0} g`} emoji="🥑" />
                <NutriStat label="Fiber" value={`${food.nutrition?.fiber || 0} g`} emoji="🥦" />
                <NutriStat label="Serving" value={food.nutrition?.servingSize || '1 serving'} emoji="🍽️" />
              </div>
            </div>
          )}

          {/* Ingredients & allergens */}
          {food.ingredients?.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display font-bold text-lg mb-3">Ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {food.ingredients.map((ing) => <Badge key={ing} tone="gray">{ing}</Badge>)}
              </div>
            </div>
          )}
          {food.allergens?.length > 0 && (
            <div className="mt-4">
              <h2 className="font-display font-bold text-lg mb-3">Allergen Information</h2>
              <div className="flex flex-wrap gap-2">
                {food.allergens.map((a) => <Badge key={a} tone="red">{a}</Badge>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="font-display font-bold text-2xl mb-6">Customer Reviews ({reviews?.length || 0})</h2>
        {reviews?.length === 0 ? (
          <p className="text-ink-500 dark:text-ink-400">No reviews yet. Be the first to review this item!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        )}
      </section>

      {/* Related items */}
      {related?.length > 0 && (
        <section className="mt-12">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 sm:p-8 mb-6 shadow-glow">
            <div className="noise absolute inset-0 opacity-40" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-white">Complete your meal</p>
                <p className="mt-1 text-white/80 text-sm">Popular picks our customers usually add with {food.name}</p>
              </div>
              <Link to="/menu" className="btn-primary !bg-white !text-brand-600 hover:!bg-white/90 shadow-none font-semibold">View Menu</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((foodItem) => <FoodCard key={foodItem._id} food={foodItem} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function NutriStat({ icon: Icon = null, label, value, emoji = '' }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/60">
      {Icon ? <Icon size={18} className="text-brand-500 shrink-0" /> : <span className="text-lg">{emoji}</span>}
      <div>
        <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
        <p className="font-semibold text-sm text-ink-800 dark:text-ink-100">{value}</p>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm">
          {review?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-ink-800 dark:text-ink-100">{review.name}</p>
          <Rating value={review.rating} size={13} />
        </div>
      </div>
      {review.title && <p className="font-medium text-sm text-ink-800 dark:text-ink-100 mb-1">{review.title}</p>}
      <p className="text-sm text-ink-600 dark:text-ink-300">{review.comment}</p>
    </div>
  );
}

function FoodDetailSkeleton() {
  return (
    <div className="container-app py-8 grid lg:grid-cols-2 gap-8">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}


