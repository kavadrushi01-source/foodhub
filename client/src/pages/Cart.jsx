import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, Tag, ArrowLeft } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { orderApi } from '../api';
import { formatCurrency, getEffectivePrice } from '../utils/format';
import { imgFallback } from '../utils/imageFallback';
import EmptyState from '../components/ui/EmptyState';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getSubtotal, clearCart, setCoupon, coupon } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const subtotal = getSubtotal();

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setLoading(true);
    try {
      const res = await orderApi.applyCoupon({ code: couponCode, subTotal: subtotal });
      setCoupon({ code: res.data.code, discount: res.data.discount });
      toast.success(`Coupon applied! Saved ${formatCurrency(res.data.discount)}`);
    } catch { setCoupon(null); } finally { setLoading(false); }
  };

  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    return (
      <div className="container-app py-10">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Looks like you haven't added anything to your cart yet."
          action={<Link to="/menu" className="btn-primary"><ShoppingBag size={18} /> Browse Menu</Link>} />
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-ink-500 hover:text-brand-600 text-sm mb-5"><ArrowLeft size={16} /> Back</button>
      <h1 className="font-display font-bold text-3xl text-ink-900 dark:text-ink-100 mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {items.map(({ food, quantity }) => (
            <div key={food._id} className="card p-4 flex gap-4">
              <Link to={`/food/${food.slug}`}>
                <img src={food.primaryImage || food.images?.[0]} alt={food.name} onError={imgFallback} className="h-20 w-20 rounded-xl object-cover bg-ink-100 dark:bg-ink-800" loading="lazy" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/food/${food.slug}`}><h3 className="font-semibold text-ink-800 dark:text-ink-100 hover:text-brand-600">{food.name}</h3></Link>
                    <p className="text-sm text-ink-500 dark:text-ink-400">{food.isVeg ? 'Vegetarian' : 'Non-Veg'} • {food.prepTime} min</p>
                    <p className="text-brand-600 dark:text-brand-400 font-semibold mt-1">{formatCurrency(getEffectivePrice(food))}</p>
                  </div>
                  <button onClick={() => removeItem(food._id)} className="text-ink-400 hover:text-red-500" aria-label="Remove"><Trash2 size={18} /></button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="inline-flex items-center border border-ink-200 dark:border-ink-700 rounded-lg overflow-hidden">
                    <button onClick={() => updateQuantity(food._id, quantity - 1)} className="p-1.5 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Decrease"><Minus size={14} /></button>
                    <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                    <button onClick={() => updateQuantity(food._id, quantity + 1)} className="p-1.5 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Increase"><Plus size={14} /></button>
                  </div>
                  <span className="font-semibold text-sm text-ink-700 dark:text-ink-200 ml-auto">{formatCurrency(getEffectivePrice(food) * quantity)}</span>
                </div>
              </div>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 size={14} /> Clear cart</button>
        </div>

        <aside className="card p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-display font-bold text-lg mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-600 dark:text-ink-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600 dark:text-green-400"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between text-ink-500 dark:text-ink-400"><span>Delivery, tax & fees</span><span>Calculated at checkout</span></div>
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-ink-100 dark:border-ink-800"><span>Total</span><span className="text-brand-600">{formatCurrency(total)}</span></div>
          </div>
          <form onSubmit={applyCoupon} className="flex gap-2 mt-4">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="input py-2 text-sm flex-1" />
            <button type="submit" disabled={loading} className="btn-secondary text-sm"><Tag size={15} /> Apply</button>
          </form>
          {coupon && <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ {coupon.code} applied</p>}
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-5">Proceed to Checkout</button>
          <Link to="/menu" className="block text-center text-sm text-ink-500 hover:text-brand-600 mt-3">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
