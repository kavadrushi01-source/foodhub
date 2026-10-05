import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2, Search } from 'lucide-react';
import useGeolocation from '../../hooks/useGeolocation';
import { reverseGeocode, forwardGeocode } from '../../utils/geocode';
import { isValidLatLng } from '../../utils/geo';

const pinIcon = L.divIcon({
  className: 'fh-pin',
  html: '<div style="background:#e11d48" class="fh-pin-dot">📍</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const ClickToMove = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

const Recenter = ({ center }) => {
  const map = useMapEvents({});
  const first = useRef(true);
  useEffect(() => {
    if (center && (first.current || map.getZoom() < 10)) {
      map.setView(center, 15);
      first.current = false;
    }
  }, [map, center?.[0], center?.[1]]);
  return null;
};

/**
 * Address picker: search box + "use my location" + draggable/click map.
 * Calls onChange({ location, suggestion }) where suggestion is a
 * reverse-geocoded address hint (caller merges into its form).
 */
export default function AddressPicker({ value, onChange, height = 240 }) {
  const hasPin = value && isValidLatLng(value.lat, value.lng);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const { locate, status: geoStatus } = useGeolocation();
  const searchTimer = useRef(null);

  const pick = async (loc) => {
    onChange?.({ location: loc, suggestion: null });
    setResolving(true);
    try {
      const suggestion = await reverseGeocode(loc.lat, loc.lng);
      if (suggestion && (suggestion.line1 || suggestion.city)) {
        onChange?.({ location: loc, suggestion });
      }
    } finally {
      setResolving(false);
    }
  };

  const onSearch = (q) => {
    setQuery(q);
    clearTimeout(searchTimer.current);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await forwardGeocode(q));
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const useMyLocation = async () => {
    const fix = await locate();
    if (fix) pick({ lat: fix.lat, lng: fix.lng });
  };

  const center = hasPin ? [value.lat, value.lng] : [22.7196, 75.8577];

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input !pl-9"
            placeholder="Search area, street, landmark…"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={geoStatus === 'locating'}
          className="btn-secondary !px-3 shrink-0"
          title="Use my current location"
        >
          {geoStatus === 'locating' ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="max-h-36 overflow-auto rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 divide-y divide-ink-100 dark:divide-ink-800">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
                onClick={() => {
                  pick({ lat: r.lat, lng: r.lng });
                  setResults([]);
                  setQuery('');
                }}
              >
                <span className="line-clamp-2">{r.display}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searching && <p className="text-xs text-ink-400">Searching…</p>}

      <div className="overflow-hidden rounded-2xl border border-ink-100 dark:border-ink-800" style={{ height }}>
        <MapContainer center={center} zoom={hasPin ? 15 : 11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {hasPin && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: (e) => { const m = e.target.getLatLng(); pick({ lat: m.lat, lng: m.lng }); } }}
            />
          )}
          <ClickToMove onPick={pick} />
          <Recenter center={hasPin ? [value.lat, value.lng] : null} />
        </MapContainer>
      </div>
      <p className="text-xs text-ink-400">
        {resolving ? 'Finding address…' : hasPin ? 'Pin set — drag it or tap anywhere to adjust.' : 'Tap the map to drop your delivery pin, or search above.'}
      </p>
    </div>
  );
}
