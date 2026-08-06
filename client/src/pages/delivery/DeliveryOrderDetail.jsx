import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Package, KeyRound, Loader2 } from 'lucide-react';
import { deliveryApi } from '../../api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function DeliveryOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setOrder((await deliveryApi.getOrder(id)).data.order); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try { await deliveryApi.updateStatus(id, { status }); toast.success(`Marked as ${status.replace(/_/g, ' ')}`); load(); } catch {} finally { setUpdating(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      const res = await deliveryApi.verifyOtp(id, otp);
      toast.success(`Delivery completed! Earned ${formatCurrency(res.data.earnings)}`);
      load();
    } catch {} finally { setOtpLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={32} /></div>;
  if (!order) return <div className="py-16 text-center"><p>Order not found.</p><Link to="/delivery/orders" className="btn-primary mt-4">Back</Link></div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-ink-500 hover:text-brand-600 text-sm mb-5"><ChevronLeft size={16} /> Back</button>

      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 shadow-glow mb-6">
        <div className="noise absolute inset-0 opacity-40" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Ordered by {order.user?.name || 'Customer'}</p>
            <h1 className="font-display font-bold text-2xl text-white mt-1">Order #{order.orderNumber}</h1>
            <p className="text-white/80 text-sm mt-1">{order.user?.phone} • {order.address?.city}</p>
          </div>
          <Badge tone="brand" className="!text-sm !px-3 !py-1 bg-white dark:bg-white !text-brand-600">{order.status.replace(/_/g, ' ')}</Badge>
        </div>
        <div className="relative flex flex-wrap gap-2 mt-5">
          {order.items.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur">
              {item.name} <span className="text-white/70">×{item.quantity}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display font-bold text-lg mb-3"><MapPin size={20} className="text-brand-500 inline mr-1" /> Delivery Address</h2>
            <p className="text-sm">{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
          </section>

          <section className="card p-6">
            <h2 className="font-display font-bold text-lg mb-3"><Package size={20} className="text-brand-500 inline mr-1" /> Items</h2>
            <div className="divide-y divide-ink-100 dark:divide-ink-800">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center py-2 gap-2">
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-ink-500">×{item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          {order.tracking?.length > 0 && (
            <section className="card p-6">
              <h2 className="font-display font-bold text-lg mb-3">Tracking</h2>
              <ul className="space-y-2">
                {[...order.tracking].reverse().map((t, i) => (
                  <li key={i} className="text-sm"><span className="capitalize font-medium">{t.status.replace(/_/g, ' ')}</span> <span className="text-ink-400">• {formatDateTime(t.at)}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display font-bold text-lg mb-3">Payment</h2>
            <p className="text-sm">Total: <span className="font-bold">{formatCurrency(order.grandTotal)}</span></p>
            <p className="text-sm text-ink-500 mt-1 capitalize">{order.payment?.method} • {order.payment?.status}</p>
          </section>

          {/* Verify Delivery OTP */}
          {order.status === 'out_for_delivery' && (
            <section className="card p-6">
              <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-3"><KeyRound size={20} className="text-brand-500" /> Verify Delivery OTP</h2>
              <form onSubmit={verifyOtp} className="flex gap-2">
                <input className="input text-center font-mono tracking-widest" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required />
                <Button type="submit" isLoading={otpLoading}>Verify</Button>
              </form>
              <p className="text-xs text-ink-400 mt-2">Ask the customer for their OTP and enter it here to complete delivery.</p>
            </section>
          )}

          <div className="flex flex-col gap-2">
            {order.status === 'pending' && (
              <>
                <Button onClick={() => updateStatus('confirmed')} isLoading={updating}>✓ Accept Order</Button>
                <p className="text-xs text-ink-400 text-center">Accepting assigns this delivery to you.</p>
              </>
            )}
            {order.status === 'confirmed' && <Button onClick={() => updateStatus('preparing')} isLoading={updating}>Mark Preparing</Button>}
            {order.status === 'preparing' && <Button onClick={() => updateStatus('out_for_delivery')} isLoading={updating}>Start Delivery</Button>}
            {order.status === 'out_for_delivery' && <p className="text-xs text-center text-amber-600">Waiting for the customer's OTP to complete the delivery.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
