import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Tag, Truck, PartyPopper } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import { orderApi } from '../../api';
import { formatCurrency, getEffectivePrice } from '../../utils/format';
import { imgFallback } from '../../utils/imageFallback';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FREE_DELIVERY = 299;

export default function CartDrawer() {
  const navigate = useNavigate();
  const { cartDrawerOpen, setCartDrawer } = useUIStore();
  const { items, removeItem, updateQuantity, getSubtotal, clearCart, setCoupon, coupon } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const subtotal = getSubtotal();
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY) * 100));
  const remaining = FREE_DELIVERY - subtotal;

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setLoading(true);
    try {
      const res = await orderApi.applyCoupon({ code: couponCode, subTotal: subtotal });
      setCoupon({ code: res.data.code, discount: res.data.discount });
      toast.success(`Coupon applied! You saved ${formatCurrency(res.data.discount)}`);
    } catch { setCoupon(null); } finally { setLoading(false); }
  };

  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const handleCheckout = () => {
    setCartDrawer(false);
    setTimeout(() => navigate('/checkout'), 100);
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setCartDrawer(false)} />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }} className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-ink-900 shadow-float flex flex-col">
            <CartHeader count={items.length} onClose={() => setCartDrawer(false)} />
            {items.length === 0 ? (
              <EmptyCart onBrowse={() => { setCartDrawer(false); navigate('/menu'); }} />
            ) : (
              <>
                <FreeDeliveryBar progress={freeDeliveryProgress} remaining={remaining} />
                <CartBody
                  items={items} removeItem={removeItem} updateQuantity={updateQuantity} clearCart={clearCart}
                  coupon={coupon} couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon} loading={loading}
                  subtotal={subtotal} discount={discount} total={total}
                  onCheckout={handleCheckout} onContinue={() => setCartDrawer(false)}
                />
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function CartHeader({ count, onClose }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-ink-800">
      <h2 className="font-display font-bold text-lg flex items-center gap-2.5">
        <span className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 grid place-items-center"><ShoppingBag size={20} className="text-brand-500" /></span>
        Your Cart ({count})
      </h2>
      <button onClick={onClose} className="p-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Close cart"><X size={22} /></button>
    </div>
  );
}

function FreeDeliveryBar({ progress, remaining }) {
  const unlocked = remaining <= 0;
  return (
    <div className="px-5 py-3 border-b border-ink-100 dark:border-ink-800 bg-brand-50/60 dark:bg-brand-900/10">
      <p className={`text-xs font-medium flex items-center gap-1.5 mb-1.5 ${unlocked ? 'text-green-600 dark:text-green-400' : 'text-ink-600 dark:text-ink-300'}`}>
        {unlocked ? <><PartyPopper size={14} /> You've unlocked FREE delivery!</> : <><Truck size={14} /> Add {formatCurrency(remaining)} more for free delivery</>}
      </p>
      <div className="h-1.5 rounded-full bg-ink-200/70 dark:bg-ink-800 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${unlocked ? 'bg-green-500' : 'bg-brand-gradient'}`} />
      </div>
    </div>
  );
}

function EmptyCart({ onBrowse }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="relative">
        <div className="p-5 rounded-full bg-brand-50 dark:bg-ink-800 mb-4"><ShoppingBag size={44} className="text-brand-400" /></div>
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-500 animate-pulse-soft" />
      </div>
      <h3 className="font-semibold text-lg text-ink-800 dark:text-ink-100">Your cart is empty</h3>
      <p className="text-sm text-ink-500 mt-1 mb-5">Add some delicious meals to get started!</p>
      <button onClick={onBrowse} className="btn-primary">Browse Menu</button>
    </div>
  );
}

function CartBody({ items, removeItem, updateQuantity, clearCart, coupon, couponCode, setCouponCode, applyCoupon, loading, subtotal, discount, total, onCheckout, onContinue }) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map(({ food, quantity }) => (
          <motion.div key={food._id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
            className="flex gap-3 card p-3 hover:shadow-card-hover transition-shadow">
            <img src={food.primaryImage || food.images?.[0]} alt={food.name} onError={imgFallback} className="h-16 w-16 rounded-xl object-cover bg-ink-100 dark:bg-ink-800" loading="lazy" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-ink-800 dark:text-ink-100 truncate">{food.name}</h4>
                <button onClick={() => removeItem(food._id)} className="text-ink-400 hover:text-red-500 hover:scale-110 transition-all shrink-0" aria-label="Remove item"><Trash2 size={16} /></button>
              </div>
              <p className="text-brand-600 dark:text-brand-400 font-semibold text-sm">{formatCurrency(getEffectivePrice(food))}</p>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => updateQuantity(food._id, quantity - 1)} className="h-7 w-7 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Decrease"><Minus size={13} /></button>
                <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                <button onClick={() => updateQuantity(food._id, quantity + 1)} className="h-7 w-7 grid place-items-center rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors" aria-label="Increase"><Plus size={13} /></button>
              </div>
            </div>
          </motion.div>
        ))}
        <div className="flex justify-center pt-1">
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"><Trash2 size={14} /> Clear cart</button>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-ink-100 dark:border-ink-800">
        {coupon ? (
          <div className="flex items-center justify-between text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2.5 rounded-xl">
            <span className="flex items-center gap-1.5 font-medium"><Tag size={14} /> {coupon.code} applied</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        ) : (
          <form onSubmit={applyCoupon} className="flex gap-2">
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="input py-2 text-sm flex-1" />
            <button type="submit" disabled={loading} className="btn-secondary text-sm shrink-0">Apply</button>
          </form>
        )}
      </div>

      <div className="p-4 border-t border-ink-100 dark:border-ink-800 space-y-2 bg-ink-50/50 dark:bg-ink-950/30">
        <div className="flex justify-between text-sm text-ink-600 dark:text-ink-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-sm text-green-600 dark:text-green-400"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
        <div className="flex justify-between font-bold text-lg pt-2.5 border-t border-ink-100 dark:border-ink-800"><span>Total</span><span className="text-gradient">{formatCurrency(total)}</span></div>
        <button onClick={onCheckout} className="btn-primary w-full mt-2 !py-3">Proceed to Checkout</button>
        <Link to="/menu" onClick={onContinue} className="block text-center text-sm text-ink-500 hover:text-brand-600 mt-1.5 transition-colors">Continue shopping</Link>
      </div>
    </>
  );
}