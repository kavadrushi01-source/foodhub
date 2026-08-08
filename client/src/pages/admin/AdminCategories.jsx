import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🍽️', description: '', displayOrder: 0 });

  const load = async () => {
    setLoading(true);
    try { setCategories((await adminApi.getCategories()).data.categories); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    try { await adminApi.createCategory(form); toast.success('Category created'); setShowForm(false); setForm({ name: '', icon: '🍽️', description: '', displayOrder: 0 }); load(); } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await adminApi.deleteCategory(id); toast.success('Category deleted'); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Categories</h1>
        <Button onClick={() => setShowForm((s) => !s)}><Plus size={16} /> New Category</Button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <input className="input" placeholder="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
          <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" className="col-span-2 md:col-span-4">Create Category</Button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="card p-5 flex flex-col items-center text-center">
              <span className="text-4xl mb-3">{c.icon}</span>
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-xs text-ink-400 mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-3"><span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500">{c.isActive ? 'Active' : 'Inactive'}</span></div>
              <button onClick={() => remove(c._id)} className="mt-3 p-1.5 text-ink-400 hover:text-red-500" aria-label="Delete"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
