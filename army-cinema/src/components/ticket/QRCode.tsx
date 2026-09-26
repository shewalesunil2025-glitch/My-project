import QR from 'qrcode';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/** The QR only ever contains the booking reference — no personal data. */
export function qrPayload(code: string) {
  return `BOOKING-ID: ${code}`;
}

export function QRCode({ value, size = 168, className }: { value: string; size?: number; className?: string }) {
  const [svg, setSvg] = useState<string>('');
  useEffect(() => {
    let alive = true;
    QR.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#050b18', light: '#ffffff' } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(''));
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <div
      role="img"
      aria-label={`QR code for ${value}`}
      className={cn('rounded-xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full', className)}
      style={{ width: size, height: size }}
      // qrcode generates this SVG locally from our own booking reference
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
