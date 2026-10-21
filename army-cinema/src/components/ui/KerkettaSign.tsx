import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Kerketta Auditorium sign — an original circular badge (not an official emblem).
 * Swap for the auditorium's own sign if one is provided.
 */
export function KerkettaSign({ className, title = 'Kerketta Auditorium' }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 120 120" className={cn('size-12', className)} role="img" aria-label={title}>
      <defs>
        <path id={`ring-${id}`} d="M60 60 m-43 0 a43 43 0 1 1 86 0 a43 43 0 1 1 -86 0" />
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3D493" />
          <stop offset="1" stopColor="#C9A24E" />
        </linearGradient>
        <linearGradient id={`tri-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF9933" />
          <stop offset=".33" stopColor="#FF9933" />
          <stop offset=".33" stopColor="#F5F7FB" />
          <stop offset=".66" stopColor="#F5F7FB" />
          <stop offset=".66" stopColor="#1DA01D" />
          <stop offset="1" stopColor="#1DA01D" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="#0b1731" />
      <circle cx="60" cy="60" r="56" fill="none" stroke={`url(#gold-${id})`} strokeWidth="2" />
      <circle cx="60" cy="60" r="34" fill="none" stroke={`url(#gold-${id})`} strokeWidth="1" opacity=".7" />
      <text fill={`url(#gold-${id})`} fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="11.5" letterSpacing="3.2">
        <textPath href={`#ring-${id}`} startOffset="0">
          KERKETTA ★ AUDITORIUM ★
        </textPath>
      </text>
      <path d="m60 33.5 2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.3-4.5 2.3.9-4.9-3.6-3.5 5-.7z" fill={`url(#gold-${id})`} />
      <text x="60" y="73" textAnchor="middle" fill="#F5F7FB" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="26" letterSpacing="1">
        KA
      </text>
      <rect x="44" y="79" width="32" height="3" rx="1.5" fill={`url(#tri-${id})`} />
    </svg>
  );
}
