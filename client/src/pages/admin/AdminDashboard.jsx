import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, UtensilsCrossed, TrendingUp, Package, Bike, Star, PlusCircle, TicketPercent, Settings, ChevronRight } from 'lucide-react';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import Badge from '../../components/ui/Badge';

const STATUS_TONE = { pending: 'amber', confirmed: 'blue', preparing: 'blue', out_for_delivery: 'brand', delivered: 'green', cancelled: 'red', refunded: 'gray' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topFoods, setTopFoods] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, t, o] = await Promise.all([adminApi.getStats(), adminApi.getRevenue(30), adminApi.getTopFoods(), adminApi.getOrders({ limit: 5 })]);
        setStats(s.data);
        setRevenue(r.data.trend || []);
        setTopFoods(t.data.topFoods || []);
        setRecent(o.data.items || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}</div>;

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);
  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), icon: DollarSign, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
    { label: 'Total Orders', value: stats?.totalOrders, icon: ShoppingCart, color: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' },
    { label: 'Customers', value: stats?.totalUsers, icon: Users, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
    { label: 'Food Items', value: stats?.totalFoods, icon: UtensilsCrossed, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
    { label: 'Pending Orders', value: stats?.pendingOrders, icon: Package, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
    { label: 'Delivered', value: stats?.deliveredOrders, icon: TrendingUp, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' },
  ];

  const actions = [
    { to: '/admin/foods', label: 'Add New Product', desc: 'Create a food item', icon: PlusCircle, color: 'from-orange-500 to-rose-500' },
    { to: '/admin/foods', label: 'Edit Products', desc: 'Update price, stock & images', icon: UtensilsCrossed, color: 'from-amber-500 to-orange-500' },
    { to: '/admin/categories', label: 'Categories', desc: 'Manage food categories', icon: ShoppingCart, color: 'from-rose-500 to-pink-500' },
    { to: '/admin/orders', label: 'Manage Orders', desc: 'Set per-item status', icon: Package, color: 'from-blue-500 to-indigo-500' },
    { to: '/admin/coupons', label: 'Coupons', desc: 'Create discount codes', icon: TicketPercent, color: 'from-purple-500 to-violet-500' },
    { to: '/admin/users', label: 'Customers', desc: 'Manage users & roles', icon: Users, color: 'from-emerald-500 to-teal-500' },
    { to: '/admin/reviews', label: 'Reviews', desc: 'Moderate feedback', icon: Star, color: 'from-yellow-500 to-amber-500' },
    { to: '/admin/settings', label: 'Settings', desc: 'Delivery, fees & tax', icon: Settings, color: 'from-slate-500 to-gray-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Dashboard</h1>
        <div className="text-sm text-ink-500">Delivery Partners: {stats?.totalDeliveryPartners ?? <Bike size={14} className="inline" />}</div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}><c.icon size={20} /></div>
            <p className="text-xl font-bold text-ink-900 dark:text-ink-100">{c.value}</p>
            <p className="text-xs text-ink-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="font-display font-bold text-lg mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {actions.map((a) => (
          <Link key={a.label} to={a.to} className="card p-4 flex items-center gap-3 hover:shadow-glow transition-all group">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white shadow group-hover:scale-110 transition-transform shrink-0`}><a.icon size={20} /></div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{a.label}</p>
              <p className="text-xs text-ink-500 truncate">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue trend */}
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-display font-bold text-lg mb-4">Revenue (Last 30 days)</h2>
          {revenue.length === 0 ? (
            <p className="text-sm text-ink-400">No sales data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {revenue.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div className="absolute -top-8 hidden group-hover:block bg-ink-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">{formatCurrency(r.revenue)}</div>
                  <div className="w-full rounded-t bg-brand-500 group-hover:bg-brand-600 transition-colors" style={{ height: `${(r.revenue / maxRevenue) * 100}%`, minHeight: '4px' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top foods */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-bold text-lg mb-4">Top Selling</h2>
          {topFoods.length === 0 ? (
            <p className="text-sm text-ink-400">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topFoods.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-ink-300 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-ink-400">{f.sold} sold</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(f.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Recent Orders</h2>
          <Link to="/admin/orders" className="text-brand-600 font-medium text-sm hover:text-brand-700">View all</Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-ink-400 flex flex-col items-center"><Package size={40} className="mb-2" /><p>No orders yet.</p></div>
        ) : (
          <div className="card divide-y divide-ink-100 dark:divide-ink-800">
            {recent.map((o) => (
              <div key={o._id} className="flex items-center gap-3 p-4">
                <span className="font-semibold text-sm">#{o.orderNumber}</span>
                <Badge tone={STATUS_TONE[o.status] || 'gray'}>{o.status.replace(/_/g, ' ')}</Badge>
                <div className="flex-1 min-w-0"><p className="text-sm text-ink-600 truncate">{o.user?.name} • {o.items?.length} item(s)</p></div>
                <span className="text-sm text-ink-500 hidden sm:block">{formatDate(o.createdAt)}</span>
                <span className="font-bold text-sm">{formatCurrency(o.grandTotal)}</span>
                <Link to="/admin/orders" className="text-brand-600 hover:text-brand-700 shrink-0"><ChevronRight size={18} /></Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}