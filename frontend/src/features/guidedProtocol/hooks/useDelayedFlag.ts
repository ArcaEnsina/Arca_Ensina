import { useEffect, useState } from 'react';

export function useDelayedFlag(active: boolean, delayMs = 250): boolean {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setDelayed(true), delayMs);
    return () => {
      clearTimeout(id);
      setDelayed(false);
    };
  }, [active, delayMs]);

  return active && delayed;
}
