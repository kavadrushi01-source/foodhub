const FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="0.5" stop-color="#f97316"/><stop offset="1" stop-color="#e11d48"/></linearGradient></defs><rect width="400" height="400" fill="#1f2937"/><rect width="400" height="400" fill="url(#g)" opacity="0.25"/><circle cx="200" cy="180" r="56" fill="url(#g)" opacity="0.9"/><text x="200" y="330" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle" opacity="0.9">FoodHub</text></svg>`,
  );

export const imgFallback = (e) => {
  if (e.target.src !== FALLBACK) e.target.src = FALLBACK;
};

export default FALLBACK;
