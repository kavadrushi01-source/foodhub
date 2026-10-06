import { useEffect, useState } from 'react';

/**
 * Mount/unmount helper that gives a CSS transition both an ENTER and an EXIT
 * animation — the job AnimatePresence does in framer-motion, without the
 * 115 kB dependency on the critical path.
 *
 * - While `open` is true the node is mounted and `shown` flips true on the
 *   next animation frame, so the browser paints the "from" state first and
 *   actually animates instead of jumping.
 * - When `open` flips false, `shown` goes false immediately (exit animation)
 *   and the node unmounts after `duration` ms.
 *
 * @param {boolean} open    whether the overlay should exist
 * @param {number} duration exit animation length in ms
 * @returns {{ mounted: boolean, shown: boolean }}
 */
export default function usePresence(open, duration = 300) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), duration);
    return () => clearTimeout(timer);
  }, [open, duration]);

  return { mounted, shown };
}
