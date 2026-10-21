import { useCallback, useEffect, useRef, useState } from 'react';
import { CHANGE_EVENT } from '@/services/api';
import { toAppError, type AppError } from '@/services/errors';

interface AsyncState<T> {
  data: T | undefined;
  error: AppError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs an async loader, re-running when `deps` change and whenever the demo
 * data changes (another tab booked a seat, admin edited a movie, …).
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[], opts: { live?: boolean } = {}): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const hasData = useRef(false);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    if (!hasData.current) setLoading(true);
    loaderRef
      .current()
      .then((d) => {
        if (!alive) return;
        hasData.current = true;
        setData(d);
        setError(null);
      })
      .catch((e) => alive && setError(toAppError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  // Deps changed → show loading state again for the new resource
  useEffect(() => {
    hasData.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (opts.live === false) return;
    const onChange = () => reload();
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, [reload, opts.live]);

  return { data, error, loading, reload };
}
