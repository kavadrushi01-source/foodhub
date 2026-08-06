import { useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import { imgFallback } from '../../utils/imageFallback';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const STATUS_TONE = { pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand', delivered: 'green', cancelled: 'red', refunded: 'gray' };
const NEXT_STATUS = { pending: 'confirmed', confirmed: 'preparing', preparing: 'out_for_delivery', out_for_delivery: 'delivered' };
const ITEM_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busyItem, setBusyItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setOrders((await adminApi.getOrders({ limit: 100, ...(filter ? { status: filter } : {}) })).data.items); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const advanceItem = async (order, item, itemId, status) => {
    setBusyItem(`${order._id}:${itemId}`);
    try {
      await adminApi.updateItemStatus(order._id, itemId, { status });
      toast.success(`"${item.name}" → ${status.replace(/_/g, ' ')}`);
      load();
    } catch {} finally { setBusyItem(null); }
  };

  const refund = async (order) => {
    if (!window.confirm(`Refund order #${order.orderNumber}?`)) return;
    try { await adminApi.refundOrder(order._id, 'Refunded by admin'); toast.success('Order refunded'); load(); } catch {}
  };

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order.orderNumber}?`)) return;
    try { await adminApi.updateOrderStatus(order._id, { status: 'cancelled', message: 'Cancelled by admin' }); toast.success('Order cancelled'); load(); } catch {}
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl">Orders</h1>
          <p className="text-sm text-ink-500 mt-0.5">Manage each item (food) in an order individually.</p>
        </div>
        <select className="input !w-48 !py-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 flex flex-col items-center"><Package size={40} className="mb-2" /><p>No orders found.</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="card overflow-hidden">
              {/* Order header */}
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-ink-50/60 dark:bg-ink-950/30 border-b border-ink-100 dark:border-ink-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">#{o.orderNumber}</span>
                    <Badge tone={STATUS_TONE[o.status] || 'gray'}>{o.status.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-ink-400">{o.payment?.method} • {o.payment?.status}</span>
                  </div>
                  <p className="text-sm text-ink-500 mt-1">{o.user?.name} • {formatDate(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(o.grandTotal)}</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => cancelOrder(o)} className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline">Cancel</button>
                    {['cancelled', 'delivered'].includes(o.status) && o.payment?.status !== 'refunded' && (
                      <button onClick={() => refund(o)} className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline">Refund</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual items */}
              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {o.items.map((item, idx) => {
                  const itemId = item._id || String(idx);
                  const key = `${o._id}:${itemId}`;
                  const busy = busyItem === key;
                  const now = item.status || 'pending';
                  return (
                    <div key={key} className="flex items-center gap-3 p-3.5 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                      <img src={item.image} alt={item.name} loading="lazy" onError={imgFallback} className="h-12 w-12 rounded-xl object-cover bg-ink-100 dark:bg-ink-800 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-ink-800 dark:text-ink-100 truncate">{item.name}</p>
                        <p className="text-xs text-ink-400">Qty {item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <div className="hidden sm:block text-right shrink-0">
                        <p className="font-semibold text-sm">{formatCurrency(item.lineTotal)}</p>
                      </div>
                      <Badge tone={STATUS_TONE[now] || 'gray'} className="shrink-0 w-fit">{now.replace(/_/g, ' ')}</Badge>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={now}
                          disabled={busy}
                          onChange={(e) => advanceItem(o, item, itemId, e.target.value)}
                          className="input !py-1.5 !px-2 text-sm !rounded-lg w-36"
                          aria-label={`Status for ${item.name}`}
                        >
                          {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                        {NEXT_STATUS[now] && (
                          <button
                            disabled={busy}
                            onClick={() => advanceItem(o, item, itemId, NEXT_STATUS[now])}
                            className="grid place-items-center h-8 w-8 rounded-lg bg-brand-gradient text-white hover:shadow-glow active:scale-95 transition-all shrink-0"
                            title={`Advance to ${NEXT_STATUS[now]}`}
                          >
                            <ChevronRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}