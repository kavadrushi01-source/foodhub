import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, MapPin, Banknote, ChevronLeft, CheckCircle, XCircle, Truck, CookingPot, ClipboardCheck, Loader2, KeyRound } from 'lucide-react';
import { orderApi, paymentApi } from '../api';
import { openRazorpayCheckout } from '../utils/razorpay';
import useAuthStore from '../store/authStore';
import { formatCurrency, formatDateTime } from '../utils/format';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { imgFallback } from '../utils/imageFallback';
import toast from 'react-hot-toast';

const STATUS_TONE = {
  pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand',
  delivered: 'green', cancelled: 'red', refunded: 'gray',
};
const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  upi: 'UPI (Google Pay / PhonePe / Paytm)',
  razorpay: 'Razorpay (Card / UPI / Net Banking)',
  stripe: 'Card / Net Banking',
};
const PAYMENT_STATUS_LABELS = {
  cod: 'Paid on delivery', paid: 'Paid', pending: 'Pending payment', failed: 'Failed', refunded: 'Refunded',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const userName = useAuthStore((s) => s.user?.name);

  const load = async () => {
    setLoading(true);
    try { setOrder((await orderApi.getOrder(id)).data.order); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderApi.cancelOrder(id, 'Cancelled by customer');
      toast.success('Order cancelled');
      load();
    } catch {} finally { setCancelling(false); }
  };

  const handleRetryPayment = async () => {
    setPaying(true);
    try {
      const rzpRes = await paymentApi.createOrder(order._id);
      const d = rzpRes.data;
      const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(window.navigator.userAgent || '');
      const payment = await openRazorpayCheckout({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency,
        orderId: d.orderId,
        name: 'FoodHub',
        description: `Order ${order.orderNumber}`,
        prefill: { name: d.name, email: d.email, contact: d.contact },
        method: order.payment?.method === 'upi' && isMobile ? { upi: { flow: 'intent' } } : null,
      });
      await paymentApi.verify({
        orderId: d.internalOrderId,
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      });
      toast.success('Payment successful!');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment could not be completed.');
    } finally { setPaying(false); }
  };

  if (loading) return <div className="container-app py-16 flex justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;
  if (!order) return <div className="container-app py-16 text-center"><p>Order not found.</p><Link to="/orders" className="btn-primary mt-4">Back to Orders</Link></div>;

  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const cancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="container-app py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-ink-500 hover:text-brand-600 text-sm mb-5"><ChevronLeft size={16} /> Back</button>

      {/* Order summary header */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 sm:p-8 shadow-glow mb-8">
        <div className="noise absolute inset-0 opacity-40" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Ordered by {userName || 'You'}</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mt-1">Order #{order.orderNumber}</h1>
            <p className="text-white/80 text-sm mt-1">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge tone={STATUS_TONE[order.status] || 'gray'} className="!text-sm !px-3 !py-1">{order.status.replace(/_/g, ' ')}</Badge>
        </div>
        <div className="relative flex flex-wrap gap-2 mt-5">
          {order.items.map((item, idx) => (
            <span key={item._id || idx} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur">
              {item.name} <span className="text-white/70">×{item.quantity}</span>
            </span>
          ))}
        </div>
      </section>

      {!cancelled ? (
        <section className="card p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-6">Order Status</h2>
          <ol className="flex items-center gap-0 overflow-x-auto">
            {STATUS_STEPS.map((step, i) => {
              const completed = i <= stepIndex;
              const icons = { pending: ClipboardCheck, confirmed: Package, preparing: CookingPot, out_for_delivery: Truck, delivered: CheckCircle };
              const Icon = icons[step];
              return (
                <li key={step} className="flex items-center flex-1 last:flex-none min-w-[80px]">
                  <div className="flex flex-col items-center text-center w-20">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${completed ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'}`}><Icon size={18} /></div>
                    <span className={`text-[11px] mt-2 font-medium ${completed ? 'text-brand-600' : 'text-ink-400'}`}>{step.replace(/_/g, ' ')}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-1 rounded ${i < stepIndex ? 'bg-brand-500' : 'bg-ink-100 dark:bg-ink-800'}`} />}
                </li>
              );
            })}
          </ol>
          {order.deliveredAt && <p className="text-sm text-ink-500 mt-4">Delivered at {formatDateTime(order.deliveredAt)}</p>}
          {order.expectedDeliveryTime && <p className="text-sm text-ink-500 mt-1">Expected delivery: {formatDateTime(order.expectedDeliveryTime)}</p>}
          {order.status === 'out_for_delivery' && order.deliveryOtp && (
            <div className="mt-5 card p-5 border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10 text-center">
              <h3 className="font-display font-bold flex items-center justify-center gap-2 text-brand-700 dark:text-brand-300"><KeyRound size={18} /> Share this OTP with your rider</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 mb-2">Tell the delivery partner this code to confirm your delivery.</p>
              <p className="font-mono font-extrabold text-4xl tracking-[0.35em] text-brand-600 dark:text-brand-400 select-all">{order.deliveryOtp}</p>
            </div>
          )}
        </section>
      ) : (
        <div className="card p-6 mb-6 flex items-center gap-3 text-red-600"><XCircle size={24} /> This order was {order.status.replace(/_/g, ' ')} {order.cancelReason ? `(${order.cancelReason})` : ''}</div>
      )}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display font-bold text-lg mb-4">Items</h2>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {order.items.map((item, idx) => (
                <div key={item._id || idx} className="flex items-center py-3 gap-3">
                  {item.image ? <img src={item.image} alt={item.name} onError={imgFallback} className="h-12 w-12 rounded-lg object-cover bg-ink-100 dark:bg-ink-800" /> : <div className="h-12 w-12 rounded-lg bg-ink-100 dark:bg-ink-800" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-ink-800 dark:text-ink-100">{item.name}</p>
                    <p className="text-xs text-ink-400">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-3"><MapPin size={20} className="text-brand-500" /> Delivery Address</h2>
            <p className="text-sm text-ink-600 dark:text-ink-300">{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
            <p className="text-sm text-ink-500 mt-1">{order.address.phone}</p>
          </section>

          {order.tracking?.length > 0 && (
            <section className="card p-6">
              <h2 className="font-display font-bold text-lg mb-4">Tracking History</h2>
              <ul className="space-y-3">
                {[...order.tracking].reverse().map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ${i === 0 ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-600'}`} />
                    <div>
                      <p className="font-medium text-sm text-ink-800 dark:text-ink-100 capitalize">{t.status.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-ink-500">{t.message || 'Status updated'} • {formatDateTime(t.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-lg mb-4"><Banknote size={20} className="text-brand-500 inline mr-1" /> Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-600 dark:text-ink-400"><span>Subtotal</span><span>{formatCurrency(order.subTotal)}</span></div>
            <div className="flex justify-between text-ink-600 dark:text-ink-400"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}</span></div>
            <div className="flex justify-between text-ink-600 dark:text-ink-400"><span>Packaging</span><span>{formatCurrency(order.packagingCharge)}</span></div>
            <div className="flex justify-between text-ink-600 dark:text-ink-400"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-ink-100 dark:border-ink-800"><span>Total</span><span className="text-brand-600">{formatCurrency(order.grandTotal)}</span></div>
            <div className="flex justify-between pt-1"><span className="text-ink-500">Payment</span><span className="capitalize">{PAYMENT_LABELS[order.payment?.method] || order.payment?.method} • {PAYMENT_STATUS_LABELS[order.payment?.status] || order.payment?.status}</span></div>
          </div>
          {order.payment?.method !== 'cod' && order.payment?.status === 'pending' && (
            <Button onClick={handleRetryPayment} isLoading={paying} className="w-full mt-5">Complete Payment</Button>
          )}
          {['pending', 'confirmed'].includes(order.status) && (
            <Button onClick={handleCancel} isLoading={cancelling} variant="danger" className="w-full mt-5">Cancel Order</Button>
          )}
        </aside>
      </div>
    </div>
  );
}

