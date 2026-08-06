import { useEffect, useState } from 'react';
import { Users, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { setUsers((await adminApi.getUsers({ limit: 100, ...(filter ? { role: filter } : {}) })).data.items); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const changeRole = async (id, role) => {
    try { await adminApi.updateUserRole(id, role); toast.success('Role updated'); load(); } catch {}
  };
  const toggleActive = async (id) => {
    try { const res = await adminApi.toggleUserActive(id); toast.success(res.data.isActive ? 'User activated' : 'User deactivated'); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Users & Roles</h1>
        <select className="input !w-48 !py-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Roles</option><option value="user">User</option><option value="admin">Admin</option><option value="delivery">Delivery</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 flex flex-col items-center"><Users size={40} className="mb-2" /><p>No users found.</p></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 dark:bg-ink-800/50 text-left text-ink-500">
                <tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-ink-50 dark:hover:bg-ink-800/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center font-semibold text-sm">{u.name?.charAt(0)}</div>
                        <div><p className="font-medium">{u.name}</p><p className="text-xs text-ink-400">{u.email}</p></div></div>
                    </td>
                    <td className="p-3">
                      <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} className="input !py-1 !px-2 !text-xs">
                        <option value="user">user</option><option value="admin">admin</option><option value="delivery">delivery</option>
                      </select>
                    </td>
                    <td className="p-3">{u.isActive ? <Badge tone="green"><CheckCircle2 size={12} /> Active</Badge> : <Badge tone="red"><Ban size={12} /> Disabled</Badge>}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => toggleActive(u._id)} className="p-1.5 text-ink-400 hover:text-amber-600" aria-label="Toggle active"><ShieldCheck size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
