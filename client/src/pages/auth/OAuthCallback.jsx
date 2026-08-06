import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authApi } from '../../api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

/**
 * Landing page for social login callbacks. The server redirects here with a
 * one-time handoff `code` (or an `error`). The code is exchanged for real JWT
 * tokens, then we finish logging in and redirect home.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthLogin = useAuthStore((s) => s.oauthLogin);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const error = params.get('error');
      if (error) {
        toast.error(error);
        navigate('/login', { replace: true });
        return;
      }

      const code = params.get('code');
      if (!code) {
        toast.error('Invalid sign-in link.');
        navigate('/login', { replace: true });
        return;
      }

      try {
        const res = await authApi.exchangeOAuth(code);
        await oauthLogin(res);
        toast.success(`Welcome, ${res.data.user.name}!`);
        navigate('/', { replace: true });
      } catch {
        toast.error('Unable to complete sign in. Please try again.');
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, oauthLogin]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-brand-gradient grid place-items-center text-3xl shadow-glow">🍔</div>
        <Loader2 className="absolute -right-4 -top-4 animate-spin text-brand-500" size={22} />
      </div>
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">Signing you in…</p>
    </div>
  );
}