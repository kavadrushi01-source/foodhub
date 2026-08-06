import { Sun, Moon } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export default function ThemeToggle({ className = '' }) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`p-2 rounded-lg text-ink-600 dark:text-ink-300 hover:bg-ink-100/80 dark:hover:bg-ink-800 transition-all active:scale-90 ${className}`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}