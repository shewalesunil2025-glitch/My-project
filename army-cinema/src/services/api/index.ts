import { demoApi } from './demoApi';
import type { Api } from './types';

export type * from './types';

export const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

let supabaseImpl: Api | null = null;

/**
 * The active backend. Demo mode (browser storage) unless Supabase env vars are set.
 * The Supabase client is loaded lazily so demo builds don't pay for it up-front.
 */
export const api: Api = new Proxy({} as Api, {
  get(_t, prop: keyof Api) {
    if (!isSupabaseConfigured) return demoApi[prop];
    if (prop === 'mode') return 'supabase';
    return async (...args: unknown[]) => {
      if (!supabaseImpl) supabaseImpl = (await import('./supabaseApi')).supabaseApi;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (supabaseImpl[prop] as any).apply(supabaseImpl, args);
    };
  },
});

export { CHANGE_EVENT, resetDemoData } from './demoStore';
