import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Package, Star, Truck, ChevronRight, BellRing } from 'lucide-react';
import { deliveryApi } from '../../api';
import { formatCurrency, timeAgo } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

const STATUS_TONE = { pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand', delivered: 'green', cancelled: 'red', refunded: 'gray' };

export default function DeliveryDashboard() {
  const [earnings, setEarnings] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [newOrders, setNewOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      const [e, d, n] = await Promise.all([
        deliveryApi.getEarnings(),
        deliveryApi.getDeliveries({ limit: 8 }),
        deliveryApi.getDeliveries({ status: 'pending', limit: 8 }),
      ]);
      setEarnings(e.data);
      setDeliveries(d.data.items);
      setNewOrders(n.data.items);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(() => load(false), 12000); return () => clearInterval(t); }, []);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>;

  const cards = [
    { label: 'Total Earnings', value: formatCurrency(earnings?.totalEarnings), icon: Wallet, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
    { label: "Today's Earnings", value: formatCurrency(earnings?.todaysEarnings), icon: Truck, color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' },
    { label: 'Total Deliveries', value: earnings?.totalDeliveries, icon: Package, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
    { label: 'New Orders', value: newOrders.length, icon: BellRing, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  ];

  const renderOrder = (o) => (
    <Link key={o._id} to={`/delivery/orders/${o.orderNumber}`} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all group">
      <div className="h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0"><Package size={20} className="text-brand-600" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">#{o.orderNumber}</span><Badge tone={STATUS_TONE[o.status] || 'gray'}>{o.status.replace(/_/g, ' ')}</Badge></div>
        <p className="text-sm text-ink-500 mt-0.5">{o.user?.name} • {o.items?.length} items • {timeAgo(o.createdAt)}</p>
      </div>
      <div className="text-right shrink-0"><p className="font-bold">{formatCurrency(o.grandTotal)}</p><ChevronRight size={18} className="ml-auto text-ink-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" /></div>
    </Link>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Delivery Dashboard</h1>
        <span className="badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"><Truck size={13} /> {deliveries.length} active orders</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}><c.icon size={20} /></div>
            <p className="text-xl font-bold text-ink-900 dark:text-ink-100">{c.value}</p>
            <p className="text-xs text-ink-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {newOrders.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><BellRing size={18} className="text-amber-500" /> New Orders To Accept</h2>
          </div>
          <div className="space-y-3">{newOrders.map(renderOrder)}</div>
        </section>
      )}

      <h2 className="font-display font-bold text-lg mb-4">Recent Orders</h2>
      {deliveries.length === 0 ? (
        <div className="card p-10 text-center text-ink-400"><Package size={40} className="mx-auto mb-2" /><p>No orders right now. New customer orders appear automatically.</p></div>
      ) : (
        <div className="space-y-3">{deliveries.map(renderOrder)}</div>
      )}
    </div>
  );
}