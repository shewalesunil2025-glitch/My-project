export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local-time `YYYY-MM-DD` key. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parses a `YYYY-MM-DD` key as a local-time date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/**
 * The screening week runs Friday → Thursday (same rule as the reference
 * auditorium). Returns the key of the Friday that starts the week containing `key`.
 */
export function weekStartKey(key: string): string {
  const d = parseDateKey(key);
  const daysFromFriday = (d.getDay() - 5 + 7) % 7;
  d.setDate(d.getDate() - daysFromFriday);
  return dateKey(d);
}

export function weekEndKey(key: string): string {
  return addDays(weekStartKey(key), 6);
}

/** "18:30" -> "6:30 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad2(m)} ${ampm}`;
}

/** "2026-09-26" -> "Sat, 26 Sep 2026" */
export function formatDate(key: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const { weekday = true, year = true } = opts;
  const d = parseDateKey(key);
  const parts = [`${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`];
  if (year) parts.push(String(d.getFullYear()));
  return (weekday ? `${DAY_SHORT[d.getDay()]}, ` : '') + parts.join(' ');
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Show start as a Date in local time. */
export function showStart(date: string, time: string): Date {
  const d = parseDateKey(date);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function isShowPast(date: string, time: string, now = new Date()): boolean {
  return showStart(date, time).getTime() <= now.getTime();
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`;
}

export function relativeDayLabel(key: string): string {
  const t = todayKey();
  if (key === t) return 'Today';
  return DAY_SHORT[parseDateKey(key).getDay()];
}
