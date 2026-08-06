export const formatCurrency = (amount, symbol = '₹') => {
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date, opts = {}) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...opts });
};

export const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

export const getEffectivePrice = (food) =>
  food?.discountPrice != null && food.discountPrice < food.price ? food.discountPrice : food?.price || 0;

export const truncate = (str, n = 100) => (str?.length > n ? str.slice(0, n) + '…' : str || '');

export const classNames = (...c) => c.filter(Boolean).join(' ');

export const debounce = (fn, delay = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
