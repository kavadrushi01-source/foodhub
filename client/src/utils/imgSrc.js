/**
 * Optimize an Unsplash catalogue image URL for its display slot.
 *
 * - `width` (optional) overrides the requested pixel width so a 64 px
 *   thumbnail doesn't download the same 800 px file as a hero image.
 * - `auto=format` lets the CDN serve AVIF/WebP to browsers that support it
 *   (typically 40–60% fewer bytes than the default JPEG).
 * - `q=72` trims quality nobody can see at catalogue sizes.
 *
 * Non-Unsplash URLs (admin uploads, the SVG fallback) pass through untouched.
 *
 * @param {string} url    original image URL
 * @param {number} [width] target display width in px
 * @returns {string}
 */
export function imgSrc(url, width) {
  if (!url || typeof url !== 'string' || !url.includes('images.unsplash.com/')) return url;
  try {
    const u = new URL(url);
    if (width) u.searchParams.set('w', String(width));
    u.searchParams.set('q', '72');
    u.searchParams.set('auto', 'format');
    return u.toString();
  } catch {
    return url;
  }
}

export default imgSrc;
