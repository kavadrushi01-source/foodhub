import { useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

/**
 * Friendly "server waking up / unreachable" card shown instead of blank
 * grids when the API can't be reached (cold start, offline,
 * or 503). Gives the user a retry action instead of silent emptiness.
 */
export default function ApiDownCard({ onRetry, compact = false }) {
  const [spinning, setSpinning] = useState(false);

  const handleRetry = () => {
    setSpinning(true);
    try {
      onRetry?.();
    } finally {
      setTimeout(() => setSpinning(false), 2000);
    }
  };

  return (
    <div className={`card p-8 text-center ${compact ? 'py-6' : 'py-10'}`}>
      <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 grid place-items-center mb-4">
        <CloudOff size={26} />
      </div>
      <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white">
        Kitchen server is waking up…
      </h3>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 max-w-md mx-auto leading-relaxed">
        Our backend sleeps when idle (free hosting) and needs ~30–60 seconds to wake.
        Your connection is fine — please wait a moment and retry.
      </p>
      <button
        onClick={handleRetry}
        className="btn-primary mt-5 inline-flex items-center gap-2"
      >
        <RefreshCw size={16} className={spinning ? 'animate-spin' : ''} />
        Retry now
      </button>
    </div>
  );
}
