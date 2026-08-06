import { useEffect, useState } from 'react';
import { Plus, Trash2, TicketPercent } from 'lucide-react';
import { adminApi } from '../../api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', maxUses: '', perUserLimit: 1, isActive: true });

  const load = async () => {
    setLoading(true);
    try { setCoupons((await adminApi.getCoupons()).data.coupons); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createCoupon({ ...form, value: Number(form.value), minOrder: Number(form.minOrder || 0), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, maxUses: form.maxUses ? Number(form.maxUses) : null, perUserLimit: Number(form.perUserLimit) });
      toast.success('Coupon created'); setShowForm(false); setForm({ code: '', description: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', maxUses: '', perUserLimit: 1, isActive: true }); load();
    } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await adminApi.deleteCoupon(id); toast.success('Coupon deleted'); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Coupons</h1>
        <Button onClick={() => setShowForm((s) => !s)}><Plus size={16} /> New Coupon</Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">Percentage</option><option value="fixed">Fixed amount</option>
          </select>
          <input className="input" placeholder="Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          <input className="input" placeholder="Min order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          <input className="input" placeholder="Max discount (optional)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
          <input className="input" placeholder="Max uses (optional)" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          <input className="input col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" className="col-span-2 md:col-span-4">Create Coupon</Button>
        </form>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 flex flex-col items-center"><TicketPercent size={40} className="mb-2" /><p>No coupons yet.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-lg text-brand-600">{c.code}</span>
                <button onClick={() => remove(c._id)} className="text-ink-400 hover:text-red-500" aria-label="Delete"><Trash2 size={16} /></button>
              </div>
              <p className="text-sm text-ink-500">{c.description || 'Coupon'}</p>
              <p className="text-sm mt-2">{c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}{c.minOrder > 0 ? ` on orders over ₹${c.minOrder}` : ''}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge tone={c.isActive ? 'green' : 'gray'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                <span className="text-xs text-ink-400">Used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
