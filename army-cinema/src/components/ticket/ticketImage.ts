import QR from 'qrcode';
import { CATEGORY_META, seatLabel } from '@/data/layouts';
import { formatDate, formatTime } from '@/lib/date';
import { formatINR } from '@/lib/format';
import type { BookingDetails } from '@/types';
import { qrPayload } from './QRCode';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Draws the ticket onto a canvas and triggers a PNG download. Fully local. */
export async function downloadTicketImage(b: BookingDetails) {
  await document.fonts?.ready;
  const W = 720;
  const H = 1180;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = '#050b18';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#ff9933');
  g.addColorStop(0.333, '#ff9933');
  g.addColorStop(0.333, '#f5f7fb');
  g.addColorStop(0.666, '#f5f7fb');
  g.addColorStop(0.666, '#138808');
  g.addColorStop(1, '#138808');

  roundRect(ctx, 40, 40, W - 80, H - 80, 28);
  ctx.fillStyle = '#0b1731';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(40, 40, W - 80, 8);
  ctx.restore();

  const font = (w: number, s: number, fam = 'Inter Variable, Inter, system-ui, sans-serif') => `${w} ${s}px ${fam}`;
  const display = 'Barlow Condensed, Inter Variable, system-ui, sans-serif';

  ctx.fillStyle = '#ffb766';
  ctx.font = font(600, 16, display);
  ctx.fillText('VEER CINEMA  ·  E-TICKET', 80, 104);
  ctx.fillStyle = '#f5f7fb';
  ctx.font = font(700, 44, display);
  ctx.fillText(b.movie.title.toUpperCase().slice(0, 26), 80, 158);
  ctx.fillStyle = '#a9b4cc';
  ctx.font = font(400, 18);
  ctx.fillText(`${b.movie.language} · ${b.movie.certification} · ${b.theatre.name}`, 80, 192);

  const field = (label: string, value: string, x: number, y: number) => {
    ctx.fillStyle = '#7c89a6';
    ctx.font = font(600, 13);
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#f5f7fb';
    ctx.font = font(600, 22);
    ctx.fillText(value, x, y + 30);
  };
  field('Date', formatDate(b.show.date), 80, 250);
  field('Show time', formatTime(b.show.time), 400, 250);
  field('Theatre', b.theatre.name, 80, 330);
  field('Category', `${CATEGORY_META[b.category].name} — ${CATEGORY_META[b.category].full}`.slice(0, 34), 80, 410);
  field('Seats', b.seats.map(seatLabel).join(', '), 80, 490);
  field('Tickets', String(b.seats.length), 400, 490);
  field('Name', b.customerName, 80, 570);
  field('Amount', `${formatINR(b.total).replace('₹', 'Rs ')}${b.paymentStatus === 'pay_at_counter' ? ' (pay at counter)' : ''}`, 400, 570);

  // perforation
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 650);
  ctx.lineTo(W - 70, 650);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#050b18';
  ctx.beginPath();
  ctx.arc(40, 650, 22, 0, Math.PI * 2);
  ctx.arc(W - 40, 650, 22, 0, Math.PI * 2);
  ctx.fill();

  const qrUrl = await QR.toDataURL(qrPayload(b.code), { margin: 1, width: 560, errorCorrectionLevel: 'M' });
  const qr = await loadImage(qrUrl);
  roundRect(ctx, W / 2 - 150, 690, 300, 300, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.drawImage(qr, W / 2 - 138, 702, 276, 276);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5f7fb';
  ctx.font = font(700, 30, display);
  ctx.fillText(b.code, W / 2, 1036);
  ctx.fillStyle = b.status === 'confirmed' ? '#4cc36b' : '#f87171';
  ctx.font = font(600, 16);
  ctx.fillText(b.status === 'confirmed' ? '✓ CONFIRMED — show this QR at the gate' : b.status.toUpperCase(), W / 2, 1068);
  ctx.fillStyle = '#7c89a6';
  ctx.font = font(400, 13);
  ctx.fillText('Carry your service ID card. One booking per mobile number per week (Fri–Thu).', W / 2, 1100);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${b.code}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
