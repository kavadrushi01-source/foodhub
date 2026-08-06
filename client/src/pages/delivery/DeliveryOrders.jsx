import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, RefreshCw } from 'lucide-react';
import { deliveryApi } from '../../api';
import { formatCurrency, timeAgo } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

const STATUS_TONE = { pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand', delivered: 'green', cancelled: 'red', refunded: 'gray' };
const FILTERS = [
  { value: '', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);
    try { setOrders((await deliveryApi.getDeliveries({ limit: 100, ...(filter ? { status: filter } : {}) })).data.items); } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const t = setInterval(() => load(false), 12000);
    return () => clearInterval(t);
  }, [filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">All Orders</h1>
          <p className="text-sm text-ink-500 mt-0.5">Every new order shows up here instantly with its current status.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input !w-44 !py-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button onClick={() => load()} className="btn-secondary !p-2" title="Refresh" aria-label="Refresh"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 flex flex-col items-center"><Package size={40} className="mb-2" /><p>No orders {filter ? `with status "${filter.replace(/_/g, ' ')}"` : 'right now'}.</p></div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o._id} to={`/delivery/orders/${o.orderNumber}`} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all group">
              <div className="h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0"><Package size={20} className="text-brand-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">#{o.orderNumber}</span>
                  <Badge tone={STATUS_TONE[o.status] || 'gray'}>{o.status.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-sm text-ink-500 mt-0.5">{o.user?.name} • {o.items?.length} item(s) • {o.address?.city} • {timeAgo(o.createdAt)}</p>
              </div>
              <div className="text-right shrink-0"><p className="font-bold">{formatCurrency(o.grandTotal)}</p><ChevronRight size={18} className="ml-auto text-ink-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
