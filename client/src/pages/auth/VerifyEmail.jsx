import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authApi } from '../../api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    setStatus('loading');
    try {
      await authApi.verifyEmail(token);
      setStatus('success');
      toast.success('Email verified successfully!');
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Verification failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="card p-8">
          <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/40 w-fit mx-auto mb-4"><MailCheck className="text-green-600 dark:text-green-400" size={32} /></div>
          {status === 'success' && (
            <>
              <h1 className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">Email verified!</h1>
              <p className="text-sm text-ink-500 mt-2 mb-6">Your account is now active. You can start ordering.</p>
              <Link to="/" className="btn-primary">Go to Home</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">Verification failed</h1>
              <p className="text-sm text-ink-500 mt-2 mb-6">{message}</p>
              <Button onClick={handleVerify} className="w-full">Retry</Button>
            </>
          )}
          {status !== 'success' && status !== 'error' && (
            <>
              <h1 className="font-display font-bold text-xl text-ink-900 dark:text-ink-100">Verify your email</h1>
              <p className="text-sm text-ink-500 mt-2 mb-6">Click below to confirm your email address.</p>
              <Button onClick={handleVerify} isLoading={status === 'loading'} className="w-full">Verify Email</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
