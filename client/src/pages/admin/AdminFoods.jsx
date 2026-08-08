import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, PackageX } from 'lucide-react';
import { adminApi } from '../../api';
import { formatCurrency } from '../../utils/format';
import { imgFallback } from '../../utils/imageFallback';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', price: '', discountPrice: '', category: '', cuisine: 'Indian', images: [], isVeg: true, isAvailable: true, stock: 0, prepTime: 15, tags: [], ingredients: [] };

export default function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try { setFoods((await adminApi.getFoods({ search, limit: 100 })).data.items); } catch {} finally { setLoading(false); }
  };
  const loadCategories = async () => { try { setCategories((await adminApi.getCategories()).data.categories); } catch {} };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const startEdit = (food) => {
    if (food) {
      setEditing(food);
      setForm({ ...emptyForm, name: food.name, description: food.description, price: String(food.price), discountPrice: food.discountPrice ? String(food.discountPrice) : '', category: food.category?._id || food.category, cuisine: food.cuisine, isVeg: food.isVeg, isAvailable: food.isAvailable, stock: food.stock, prepTime: food.prepTime });
    } else { setEditing('new'); setForm(emptyForm); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) { toast.error('Name, description, price and category are required'); return; }
    const payload = { ...form, price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : null, stock: Number(form.stock), prepTime: Number(form.prepTime) };
    try {
      if (editing === 'new') { await adminApi.createFood(payload); toast.success('Food created'); }
      else { await adminApi.updateFood(editing._id, payload); toast.success('Food updated'); }
      setEditing(null); load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save food');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try { await adminApi.deleteFood(id); toast.success('Food deleted'); load(); } catch {}
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-bold text-2xl">Food Items</h1>
        <div className="flex items-center gap-3">
          <input className="input !py-2 w-48" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button onClick={() => startEdit(null)}><Plus size={16} /> Add Food</Button>
        </div>
      </div>
      {editing && (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-4">{editing === 'new' ? 'Add New Food' : `Edit: ${editing.name}`}</h2>
          <form onSubmit={save} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="input" placeholder="Discount price (optional)" type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Cuisine" value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} />
            <input className="input" placeholder="Prep time (min)" type="number" value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} />
            <input className="input sm:col-span-2 lg:col-span-3" placeholder="Description (min 10 chars)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <input className="input sm:col-span-2 lg:col-span-3" placeholder="Image URL (comma separated)" value={form.images.join(', ')} onChange={(e) => setForm({ ...form, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <input className="input" placeholder="Ingredients (comma separated)" value={form.ingredients.join(', ')} onChange={(e) => setForm({ ...form, ingredients: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <input className="input" placeholder="Tags (comma separated)" value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <input className="input" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} /> Veg</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} /> Available</label>
            </div>
            <div className="flex items-center gap-3"><Button type="submit">{editing === 'new' ? 'Create' : 'Save'}</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : foods.length === 0 ? (
          <div className="p-10 text-center text-ink-400 flex flex-col items-center"><PackageX size={40} className="mb-2" /><p>No food items found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/50 text-left text-ink-500 dark:text-ink-400">
                <tr>
                  <th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {foods.map((f) => (
                  <tr key={f._id} className="hover:bg-ink-50 dark:hover:bg-ink-800/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2"><img src={f.primaryImage || f.images?.[0]} alt="" onError={imgFallback} className="h-9 w-9 rounded-lg object-cover bg-ink-100 dark:bg-ink-800" /><span className="font-medium truncate max-w-[180px]">{f.name}</span></div>
                    </td>
                    <td className="p-3 text-ink-500">{f.category?.name || '-'}</td>
                    <td className="p-3"><span className="font-semibold">{formatCurrency(adminEffectivePrice(f))}</span>{f.discountPrice && f.discountPrice < f.price ? <span className="text-xs text-ink-400 line-through ml-1">{formatCurrency(f.price)}</span> : null}</td>
                    <td className="p-3">{f.stock}</td>
                    <td className="p-3">{f.isAvailable ? <Badge tone="green">Active</Badge> : <Badge tone="red">Unavailable</Badge>}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(f)} className="p-1.5 text-ink-500 hover:text-brand-600" aria-label="Edit"><Pencil size={16} /></button>
                      <button onClick={() => remove(f._id)} className="p-1.5 text-ink-400 hover:text-red-500" aria-label="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function adminEffectivePrice(f) { return f.discountPrice != null && f.discountPrice < f.price ? f.discountPrice : f.price; }

