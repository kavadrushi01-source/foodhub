import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import AuthLayout from '../../components/auth/AuthLayout';
import SocialAuth from '../../components/auth/SocialAuth';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(form);
      toast.success('Account created! Check your email to verify.');
      navigate(form.role === 'delivery' ? '/delivery' : '/', { replace: true });
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join FoodHub and enjoy delicious meals"
      footer={<>Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Login</Link></>}
    >
      <form onSubmit={handleSubmit} className="card p-6 sm:p-7 space-y-4 mt-6 shadow-float">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input pl-11" placeholder="John Doe" autoComplete="name" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input pl-11" placeholder="you@example.com" autoComplete="email" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Phone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input pl-11" placeholder="+91..." />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input id="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pl-11 pr-11" placeholder="••••••••" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-brand-600 transition-colors" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <span className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">I am joining as</span>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setForm({ ...form, role: 'user' })} className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.role === 'user' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 shadow-glow' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>🍽️ Customer</button>
            <button type="button" onClick={() => setForm({ ...form, role: 'delivery' })} className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.role === 'delivery' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 shadow-glow' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300'}`}>🛵 Delivery Partner</button>
          </div>
        </div>
        <Button type="submit" isLoading={loading} className="w-full !py-3">Create Account</Button>
      </form>
      <SocialAuth />
    </AuthLayout>
  );
}