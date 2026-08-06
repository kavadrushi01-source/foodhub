import { Star } from 'lucide-react';
import { classNames } from '../../utils/format';

export default function Rating({ value = 0, count = null, size = 16, showCount = false, className = '' }) {
  return (
    <span className={classNames('inline-flex items-center gap-1', className)}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-ink-300 dark:text-ink-600'}
          />
        ))}
      </span>
      {showCount && value > 0 && (
        <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
          {Number(value).toFixed(1)}{count != null ? ` (${count})` : ''}
        </span>
      )}
    </span>
  );
}
