import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Shared Leaflet map (Phase 1). Renders customer/store/partner pins +
 * optional road route polyline. Lazy-loaded by callers so the main
 * bundle never pays for Leaflet.
 *
 * Props:
 *  customer {lat,lng} | null — delivery pin (red)
 *  partner  {lat,lng} | null — rider live dot (blue, pulsing)
 *  store    {lat,lng} | null — restaurant pin (green)
 *  route    [[lat,lng]...] | null — OSRM road polyline
 *  interactive (default true), height (default 280)
 */

// DivIcon pins — no image assets, so no Vite marker-icon breakage.
const pin = (color, glyph) =>
  L.divIcon({
    className: 'fh-pin',
    html: `<div style="background:${color}" class="fh-pin-dot">${glyph}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const CUSTOMER_ICON = pin('#e11d48', '📍');
const STORE_ICON = pin('#059669', '🏠');
const PARTNER_ICON = pin('#2563eb', '🛵');

const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    const valid = (points || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (valid.length >= 2) {
      map.fitBounds(L.latLngBounds(valid), { padding: [36, 36] });
    } else if (valid.length === 1) {
      map.setView(valid[0], 15);
    }
  }, [map, JSON.stringify(points)]);
  return null;
};

export default function DeliveryMap({ customer, partner, store, route, interactive = true, height = 280 }) {
  const toLL = (p) => (p && Number.isFinite(p.lat) && Number.isFinite(p.lng) ? [p.lat, p.lng] : null);
  const cLL = toLL(customer);
  const pLL = toLL(partner);
  const sLL = toLL(store);

  const center = useMemo(() => cLL || pLL || sLL || [22.7196, 75.8577], []); // fallback: Indore
  const fitPoints = useMemo(() => [cLL, pLL, sLL, ...(route || [])].filter(Boolean), [cLL, pLL, sLL, route]);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800" style={{ height }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {sLL && <Marker position={sLL} icon={STORE_ICON} />}
        {cLL && <Marker position={cLL} icon={CUSTOMER_ICON} />}
        {pLL && <Marker position={pLL} icon={PARTNER_ICON} />}
        {route?.length > 1 && <Polyline positions={route} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85 }} />}
        <FitBounds points={fitPoints} />
      </MapContainer>
    </div>
  );
}
