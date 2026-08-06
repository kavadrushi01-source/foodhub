import { classNames } from '../../utils/format';

const TONES = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  gray: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function Badge({ children, tone = 'gray', className = '', icon: Icon = null }) {
  return (
    <span className={classNames('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
