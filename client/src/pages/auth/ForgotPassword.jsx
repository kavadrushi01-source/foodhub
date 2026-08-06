import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('If an account exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-6"><ArrowLeft size={16} /> Back to login</Link>
        <div className="card p-6">
          <div className="p-3 rounded-full bg-brand-100 dark:bg-brand-900/40 w-fit mb-4"><Mail className="text-brand-500" size={24} /></div>
          <h1 className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">Forgot your password?</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-6">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-xl text-sm">
              Reset link sent! Please check your email and follow the instructions.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" />
              </div>
              <Button type="submit" isLoading={loading} className="w-full">Send Reset Link</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
