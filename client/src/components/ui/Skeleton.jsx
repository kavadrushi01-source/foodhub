import { classNames } from '../../utils/format';

function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return <div className={classNames('skeleton', rounded, className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-40 w-full" rounded="rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-9 w-full" rounded="rounded-xl" />
    </div>
  );
}

export default Skeleton;
