import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import AuthLayout from '../../components/auth/AuthLayout';
import SocialAuth from '../../components/auth/SocialAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(from, { replace: true });
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue ordering delicious food"
      footer={<>Don't have an account? <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-4 mt-6 shadow-float">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input pl-11" placeholder="you@example.com" autoComplete="email" />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pl-11 pr-11" placeholder="••••••••" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-brand-600 transition-colors" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300 cursor-pointer select-none">
            <input type="checkbox" checked={form.rememberMe} onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })} className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500/30" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Forgot password?</Link>
        </div>
        <Button type="submit" isLoading={loading} className="w-full !py-3">Login</Button>
      </form>
      <SocialAuth />
    </AuthLayout>
  );
}