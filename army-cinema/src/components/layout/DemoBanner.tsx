import { FlaskConical, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/services/api';

export function DemoBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('vc:banner') === '0';
    } catch {
      return false;
    }
  });
  if (hidden || api.mode !== 'demo') return null;
  return (
    <div className="relative z-50 border-b border-saffron/20 bg-saffron/10 text-xs text-saffron-soft">
      <div className="container-page flex items-center gap-2 py-2 pr-10">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">Demo prototype</strong> — mock service verification &amp; simulated payments. Data is
          stored in this browser only.
        </p>
      </div>
      <button
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem('vc:banner', '0');
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-white/5"
        aria-label="Dismiss demo notice"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
