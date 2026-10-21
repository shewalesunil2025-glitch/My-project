import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const SAFFRON = '#FF9933';
const WHITE = '#FFFFFF';
const GREEN = '#138808';
const NAVY = '#000080';

/** Draws the national flag (3:2, Ashoka Chakra with 24 spokes) onto a canvas used as a texture. */
function makeFlagTexture(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const band = h / 3;
  g.fillStyle = SAFFRON;
  g.fillRect(0, 0, w, band);
  g.fillStyle = WHITE;
  g.fillRect(0, band, w, band);
  g.fillStyle = GREEN;
  g.fillRect(0, band * 2, w, band);

  // Ashoka Chakra
  const cx = w / 2;
  const cy = h / 2;
  const r = band * 0.44;
  g.strokeStyle = NAVY;
  g.fillStyle = NAVY;
  g.lineWidth = r * 0.09;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, r * 0.17, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    // tapered spoke
    const tipX = cx + Math.cos(a) * r * 0.95;
    const tipY = cy + Math.sin(a) * r * 0.95;
    const side = a + Math.PI / 2;
    const bw = r * 0.045;
    const mx = cx + Math.cos(a) * r * 0.35;
    const my = cy + Math.sin(a) * r * 0.35;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(mx + Math.cos(side) * bw, my + Math.sin(side) * bw);
    g.lineTo(tipX, tipY);
    g.lineTo(mx - Math.cos(side) * bw, my - Math.sin(side) * bw);
    g.closePath();
    g.fill();
    // small rim dots between spokes
    const b = a + Math.PI / 24;
    g.beginPath();
    g.arc(cx + Math.cos(b) * r * 0.93, cy + Math.sin(b) * r * 0.93, r * 0.035, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/**
 * A softly waving tricolour on a gold flagstaff, rendered on canvas.
 * Pauses when off-screen or when the tab is hidden; static for reduced motion.
 */
export function WavingFlag({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const texture = makeFlagTexture(900, 600);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let visible = true;
    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const poleX = W * 0.06;
      const poleW = Math.max(4, W * 0.018);
      const top = H * 0.08;
      const fw = W * 0.86;
      const fh = (fw * 2) / 3;
      const fx = poleX + poleW;
      const amp = fh * 0.07;
      const k = (Math.PI * 2) / (fw * 0.72);
      const speed = 0.0022;

      // flagstaff
      const pg = ctx.createLinearGradient(poleX, 0, poleX + poleW, 0);
      pg.addColorStop(0, '#8a6a2c');
      pg.addColorStop(0.45, '#f3d493');
      pg.addColorStop(1, '#7a5a22');
      ctx.fillStyle = pg;
      ctx.fillRect(poleX, top - poleW, poleW, H - top);
      ctx.beginPath();
      ctx.arc(poleX + poleW / 2, top - poleW * 1.6, poleW * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#e9b95c';
      ctx.fill();

      // cloth, drawn in thin vertical slices displaced by a travelling wave
      const slice = 2;
      ctx.imageSmoothingEnabled = true;
      for (let x = 0; x < fw; x += slice) {
        const damp = Math.pow(x / fw, 0.9);
        const phase = x * k - t * speed;
        const dy = Math.sin(phase) * amp * damp;
        const sx = (x / fw) * texture.width;
        const sw = (slice / fw) * texture.width + 1;
        ctx.drawImage(texture, sx, 0, sw, texture.height, fx + x, top + dy, slice + 0.6, fh);
      }
      // Light and shadow along the folds, drawn in exact (non-overlapping) columns so no stripes appear
      for (let x = 0; x < fw; x += slice) {
        const damp = Math.pow(x / fw, 0.9);
        const phase = x * k - t * speed;
        const dy = Math.sin(phase) * amp * damp;
        const light = Math.cos(phase) * damp;
        ctx.fillStyle = light > 0 ? `rgba(255,255,255,${light * 0.12})` : `rgba(0,0,0,${-light * 0.26})`;
        ctx.fillRect(Math.round(fx + x), top + dy, slice, fh);
      }
    };

    const loop = (t: number) => {
      draw(t);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    resize();
    draw(1200);
    if (!reduce) start();

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce) start();
    });
    io.observe(canvas);
    const onVis = () => !document.hidden && !reduce && visible && start();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} role="img" aria-label="The Indian national flag waving on a flagstaff" className={cn('block h-full w-full', className)} />;
}
