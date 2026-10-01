import { useState } from 'react';
import { User, Mail, Phone, Save, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authApi } from '../api';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(form); toast.success('Profile updated'); } catch {} finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) { toast.error('Password must be 8+ characters'); return; }
    setPwdLoading(true);
    try { await authApi.changePassword(pwd); toast.success('Password changed'); setPwd({ currentPassword: '', newPassword: '' }); } catch {} finally { setPwdLoading(false); }
  };

  return (
    <div className="container-app py-6 sm:py-10 max-w-3xl">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink-900 dark:text-ink-100 mb-5 sm:mb-8">My Profile</h1>

      <div className="card p-4 sm:p-6 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xl sm:text-2xl">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <h2 className="font-semibold text-base sm:text-lg text-ink-900 dark:text-ink-100 truncate">{user?.name}</h2>
            <p className="text-sm text-ink-500 flex items-center gap-1 min-w-0"><Mail size={14} className="shrink-0" /> <span className="truncate">{user?.email}</span></p>
            <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 capitalize mt-1">{user?.role}</span>
          </div>
        </div>
        <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5"><User size={14} className="inline mr-1" />Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5"><Phone size={14} className="inline mr-1" />Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2"><Button type="submit" isLoading={saving}><Save size={16} /> Save Changes</Button></div>
        </form>
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="font-display font-bold text-lg mb-4"><KeyRound size={20} className="text-brand-500 inline mr-1" /> Change Password</h2>
        <form onSubmit={handlePassword} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Current Password</label>
            <input type="password" className="input" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">New Password</label>
            <input type="password" className="input" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <div className="sm:col-span-2"><Button type="submit" isLoading={pwdLoading} variant="secondary">Update Password</Button></div>
        </form>
      </div>
    </div>
  );
}
