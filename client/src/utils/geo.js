/**
 * Shared geo math + free routing helpers (Phase 1 of live delivery map).
 *
 * - Haversine for offline straight-line km (fallback when OSRM is down).
 * - OSRM public demo server for real ROAD distance/duration/polyline.
 * - No API keys anywhere. All free.
 */

export const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

/** Straight-line distance in km between two {lat,lng} points. */
export const haversineKm = (a, b) => {
  if (!a || !b || !isValidLatLng(a.lat, a.lng) || !isValidLatLng(b.lat, b.lng)) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(aa));
};

/** Rough ETA text from km. City two-wheeler avg ~25 km/h + prep buffer. */
export const etaText = (km, prepMin = 0) => {
  if (km == null || !Number.isFinite(km)) return '—';
  const mins = Math.max(2, Math.round((km / 25) * 60 + prepMin));
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `~${h} hr` : `~${h} hr ${m} min`;
};

export const kmText = (km) => {
  if (km == null || !Number.isFinite(km)) return '—';
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
};

/** Two points are "the same place" if within ~20m (debounces GPS jitter). */
export const samePlace = (a, b, thresholdKm = 0.02) => {
  const d = haversineKm(a, b);
  return d != null && d <= thresholdKm;
};

// ---- OSRM (free road routing, no key) ----

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
// Cache routes for 60s: same order re-polled every 12-15s shouldn't hammer the demo server.
const routeCache = new Map();
const ROUTE_TTL_MS = 60 * 1000;

const cacheKey = (from, to) =>
  `${from.lat.toFixed(5)},${from.lng.toFixed(5)}>${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;

/**
 * Real road distance/duration/polyline between two pins.
 * Returns { km, durationMin, polyline: [[lat,lng]...], road: true }
 * or { km: haversine, road: false } when OSRM is unreachable.
 */
export const fetchRoute = async (from, to) => {
  const straight = haversineKm(from, to);
  if (!from || !to || !isValidLatLng(from.lat, from.lng) || !isValidLatLng(to.lat, to.lng)) {
    return { km: straight, durationMin: null, polyline: null, road: false };
  }
  const key = cacheKey(from, to);
  const hit = routeCache.get(key);
  if (hit && Date.now() - hit.at < ROUTE_TTL_MS) return hit.data;

  try {
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route) throw new Error('no route');
    const data = {
      km: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      // OSRM geojson = [lng,lat]; Leaflet wants [lat,lng]
      polyline: route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || null,
      road: true,
    };
    routeCache.set(key, { at: Date.now(), data });
    return data;
  } catch {
    // Fair-use server busy/down — fall back to straight-line math, never crash the UI.
    return { km: straight, durationMin: null, polyline: null, road: false };
  }
};

/** Google Maps directions deep-link (free, no key) for the Navigate button. */
export const googleMapsDirUrl = (from, to) => {
  const o = `${from.lat},${from.lng}`;
  const d = `${to.lat},${to.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}`;
};
