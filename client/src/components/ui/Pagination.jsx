import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;

  const getPages = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="p-2 rounded-lg border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 disabled:opacity-40 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {getPages().map((p) => (
        <button key={p} onClick={() => onPage(p)} className={`h-9 w-9 rounded-lg text-sm font-medium ${p === page ? 'bg-brand-500 text-white' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="p-2 rounded-lg border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 disabled:opacity-40 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
