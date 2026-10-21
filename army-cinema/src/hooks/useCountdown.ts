import { useEffect, useState } from 'react';

/** Milliseconds remaining until `target` (ISO string), updated every second. */
export function useCountdown(target: string | null | undefined): number {
  const calc = () => (target ? Math.max(0, new Date(target).getTime() - Date.now()) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!target) return;
    const id = window.setInterval(() => setLeft(calc()), 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return left;
}
