/**
 * Free reverse/forward geocoding via OpenStreetMap Nominatim (no key).
 * Respects the 1 req/sec usage policy: debounced + cached.
 */

const revCache = new Map(); // "lat,lng(3dp)" -> address parts
const fwdCache = new Map(); // query -> [{lat,lng,display}]
let lastCall = 0;

const throttle = async () => {
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
};

const pick = (addr = {}) => ({
  line1: [addr.road || addr.pedestrian || addr.footway || '', addr.house_number || addr.suburb || addr.neighbourhood || '']
    .filter(Boolean)
    .join(' ')
    .trim(),
  city: addr.city || addr.town || addr.village || addr.county || '',
  state: addr.state || '',
  pincode: addr.postcode || '',
});

/** Pin -> editable address suggestion. Returns null on failure (never throws). */
export const reverseGeocode = async (lat, lng) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (revCache.has(key)) return revCache.get(key);
  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const out = { ...pick(json?.address), display: json?.display_name || '' };
    revCache.set(key, out);
    return out;
  } catch {
    return null;
  }
};

/** Text -> list of candidate pins. Returns [] on failure. */
export const forwardGeocode = async (query) => {
  const q = String(query || '').trim();
  if (q.length < 3) return [];
  if (fwdCache.has(q)) return fwdCache.get(q);
  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const out = (await res.json()).map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lon),
      display: r.display_name,
    }));
    fwdCache.set(q, out);
    return out;
  } catch {
    return [];
  }
};
