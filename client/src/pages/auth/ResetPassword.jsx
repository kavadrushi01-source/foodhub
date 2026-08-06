import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-6">
          <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900/40 w-fit mb-4"><Lock className="text-brand-500" size={24} /></div>
          <h1 className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">Set a new password</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-6">Choose a strong, unique password.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="New password" autoComplete="new-password" />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input pl-10 pr-10" placeholder="Confirm password" autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" aria-label="Toggle password visibility">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <Button type="submit" isLoading={loading} className="w-full">Reset Password</Button>
          </form>
        </div>
        <p className="text-center text-sm mt-4"><Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Back to login</Link></p>
      </div>
    </div>
  );
}
