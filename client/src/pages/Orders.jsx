import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '../api';
import { formatCurrency, formatDate } from '../utils/format';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const STATUS_TONE = {
  pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand',
  delivered: 'green', cancelled: 'red', refunded: 'gray',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders({ page, limit: 8 });
      setOrders(res.data.items);
      setMeta(res.data.meta);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="container-app py-10">
      <h1 className="font-display font-bold text-3xl text-ink-900 dark:text-ink-100 mb-8">My Orders</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="Your order history will appear here. Start exploring our delicious menu!" action={<Link to="/menu" className="btn-primary">Browse Menu</Link>} />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o._id} to={`/orders/${o.orderNumber}`} className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
                <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                  <Package size={22} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-semibold text-ink-800 dark:text-ink-100">#{o.orderNumber}</span>
                    <Badge tone={STATUS_TONE[o.status] || 'gray'}>{o.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{o.items.length} item(s) • {formatDate(o.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-ink-900 dark:text-ink-100">{formatCurrency(o.grandTotal)}</p>
                  <ChevronRight size={18} className="ml-auto text-ink-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
          {meta && meta.totalPages > 1 && <Pagination meta={meta} onPage={setPage} />}
        </>
      )}
    </div>
  );
}
