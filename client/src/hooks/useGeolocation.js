import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Browser geolocation wrapper (Phase 1 of live delivery map).
 * Exposes permission-aware state + one-shot locate + live watch.
 * Never throws — all failures become friendly toasts + state.
 */
export default function useGeolocation() {
  const [position, setPosition] = useState(null); // {lat,lng,accuracy}
  const [status, setStatus] = useState('idle'); // idle|locating|watching|denied|unavailable|error
  const [error, setError] = useState('');
  const watchId = useRef(null);

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const explain = (err) => {
    if (!err) return 'Location unavailable.';
    if (err.code === 1) return 'Location permission denied. Allow access or drag the pin manually.';
    if (err.code === 2) return 'Position unavailable. Check GPS/network or drag the pin manually.';
    if (err.code === 3) return 'Location request timed out. Try again or drag the pin manually.';
    return err.message || 'Location unavailable.';
  };

  const locate = useCallback(
    (onFix) =>
      new Promise((resolve) => {
        if (!supported) {
          const msg = 'Geolocation is not supported by this browser. Drag the pin manually.';
          setStatus('unavailable');
          setError(msg);
          toast.error(msg);
          resolve(null);
          return;
        }
        setStatus('locating');
        setError('');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
            setPosition(fix);
            setStatus('idle');
            onFix?.(fix);
            resolve(fix);
          },
          (err) => {
            const msg = explain(err);
            setStatus(err?.code === 1 ? 'denied' : 'error');
            setError(msg);
            toast.error(msg);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
        );
      }),
    [supported],
  );

  const startWatch = useCallback(
    (onFix) => {
      if (!supported) return null;
      stopWatch();
      setStatus('watching');
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setPosition(fix);
          onFix?.(fix);
        },
        (err) => {
          const msg = explain(err);
          setStatus(err?.code === 1 ? 'denied' : 'error');
          setError(msg);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
      return watchId.current;
    },
    [supported],
  );

  const stopWatch = useCallback(() => {
    if (watchId.current != null && supported) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setStatus((s) => (s === 'watching' ? 'idle' : s));
  }, [supported]);

  useEffect(() => () => stopWatch(), [stopWatch]);

  return { position, status, error, supported, locate, startWatch, stopWatch };
}
