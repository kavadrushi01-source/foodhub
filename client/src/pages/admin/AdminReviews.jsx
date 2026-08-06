import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { adminApi } from '../../api';
import Rating from '../../components/ui/Rating';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setReviews((await adminApi.getReviews({ limit: 100 })).data.items); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try { await adminApi.deleteReview(id); toast.success('Review deleted'); load(); } catch {}
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">Reviews</h1>
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="card p-10 text-center text-ink-400 flex flex-col items-center"><Star size={40} className="mb-2" /><p>No reviews yet.</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="card p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center font-semibold text-sm shrink-0">{r.user?.name?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{r.user?.name} <span className="text-ink-400 font-normal">on {r.food?.name}</span></p>
                  <button onClick={() => remove(r._id)} className="text-ink-400 hover:text-red-500 shrink-0" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
                <Rating value={r.rating} size={13} />
                <p className="text-sm text-ink-500 mt-1">{r.comment}</p>
                <p className="text-xs text-ink-400 mt-1">Reported: {r.reportedCount} • Helpful: {r.helpfulCount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
