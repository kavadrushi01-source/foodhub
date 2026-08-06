import { useEffect, useState } from 'react';
import { authApi, getOAuthUrl } from '../../api';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.78-2.12-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43A11.98 11.98 0 0 0 1.29 6.62l3.98 3.1C6.22 6.89 8.87 4.77 12 4.77Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="fill-current">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
  </svg>
);

/**
 * Google / Facebook sign-in buttons. Providers that aren't configured on the
 * server are hidden so the UI never shows a dead button.
 */
export default function SocialAuth() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    let mounted = true;
    authApi
      .getOAuthProviders()
      .then((res) => mounted && setProviders(res.data || {}))
      .catch(() => mounted && setProviders({}));
    return () => {
      mounted = false;
    };
  }, []);

  if (providers === null) return null;
  const enabled = Object.values(providers).some(Boolean);
  if (!enabled) return null;
  const count = Number(Boolean(providers.google)) + Number(Boolean(providers.facebook));

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">or continue with</span>
        <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
      </div>
      <div className={`mt-4 grid gap-3 ${count > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {providers.google && (
          <a
            href={getOAuthUrl('google')}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-semibold text-ink-700 dark:text-ink-100 hover:border-ink-300 hover:shadow-sm transition-all"
          >
            <GoogleIcon /> Google
          </a>
        )}
        {providers.facebook && (
          <a
            href={getOAuthUrl('facebook')}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-semibold text-ink-700 dark:text-ink-100 hover:border-ink-300 hover:shadow-sm transition-all"
          >
            <FacebookIcon /> Facebook
          </a>
        )}
      </div>
    </div>
  );
}

export { GoogleIcon, FacebookIcon };
