import { hashPassword, randomSalt } from '@/lib/crypto';
import { addDays, parseDateKey, todayKey, weekStartKey } from '@/lib/date';
import { safeStorage } from '@/lib/storage';
import { getLayout, sortSeatIds } from '@/data/layouts';
import {
  DEFAULT_PRICES,
  SEED_MOVIES,
  SEED_SCREENS,
  SEED_THEATRES,
  SEED_USERS,
  THEATRE_ROTATION,
} from '@/data/seed';
import type { Booking, Movie, Profile, RankCategory, Screen, Show, Theatre } from '@/types';

export interface StoredUser extends Profile {
  salt: string;
  hash: string;
}

export interface OtpRecord {
  userId: string;
  code: string;
  purpose: 'login' | 'reset';
  expiresAt: number;
  attempts: number;
}

export interface DemoDb {
  version: number;
  generatedThrough: string;
  movies: Movie[];
  theatres: Theatre[];
  screens: Screen[];
  shows: Show[];
  users: StoredUser[];
  bookings: Booking[];
  counter: number;
  otps: OtpRecord[];
}

const DB_KEY = 'vc:db';
const DB_VERSION = 4;
export const CHANGE_EVENT = 'vc:db-changed';

let cache: DemoDb | null = null;
let seeding: Promise<DemoDb> | null = null;

/* ----------------------------- random helpers ----------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const GUEST_NAMES = [
  'R. Thapa', 'S. Negi', 'K. Rawat', 'P. Chauhan', 'A. Bisht', 'M. Gurung', 'D. Pillai', 'V. Nair', 'H. Sandhu',
  'J. Dogra', 'N. Rana', 'T. Bhatt', 'B. Kaur', 'L. Singh', 'G. Yadav', 'C. Sharma', 'F. Khan', 'E. Das',
];

/* ------------------------------ show seeding ------------------------------ */

function pickMovie(movies: Movie[], theatreId: string, date: string, slotIndex: number): Movie | null {
  const rotation = (THEATRE_ROTATION[theatreId] ?? [])
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m && m.status !== 'archived' && m.releaseDate <= date);
  if (rotation.length) {
    const dayIndex = Math.floor(parseDateKey(date).getTime() / 86_400_000);
    return rotation[(dayIndex + slotIndex) % rotation.length];
  }
  // Fall back to the most recent release that was out on that date
  const released = movies
    .filter((m) => m.status !== 'upcoming' && m.releaseDate <= date)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return released[0] ?? null;
}

/** Generates demo shows for seeded theatres up to 13 days ahead. */
function ensureShows(db: DemoDb): boolean {
  const target = addDays(todayKey(), 13);
  if (db.generatedThrough >= target) return false;
  let d = addDays(db.generatedThrough, 1);
  while (d <= target) {
    for (const theatre of db.theatres) {
      if (!theatre.active || !THEATRE_ROTATION[theatre.id]) continue;
      const screen = db.screens.find((s) => s.theatreId === theatre.id);
      if (!screen) continue;
      const slots = theatre.weeklySchedule[parseDateKey(d).getDay()] ?? [];
      slots.forEach((time, i) => {
        const movie = pickMovie(db.movies, theatre.id, d, i);
        if (!movie) return;
        if (db.shows.some((s) => s.screenId === screen.id && s.date === d && s.time === time)) return;
        db.shows.push({
          id: `sh-${theatre.id.slice(3)}-${d}-${time.replace(':', '')}`,
          movieId: movie.id,
          theatreId: theatre.id,
          screenId: screen.id,
          date: d,
          time,
          prices: { ...DEFAULT_PRICES },
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        });
      });
    }
    d = addDays(d, 1);
  }
  db.generatedThrough = target;
  return true;
}

export function nextBookingCode(db: DemoDb, year = new Date().getFullYear()): string {
  db.counter += 1;
  return `ARM-${year}-${String(db.counter).padStart(6, '0')}`;
}

/** Walk-in / counter sales so seat maps look realistic. */
function seedCounterBookings(db: DemoDb) {
  const today = todayKey();
  const from = addDays(today, -10);
  const to = addDays(today, 6);
  let mobileSeq = 7000000000;
  const shows = db.shows
    .filter((s) => s.date >= from && s.date <= to)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  for (const show of shows) {
    const rng = mulberry32(hashString(show.id));
    const screen = db.screens.find((s) => s.id === show.screenId)!;
    const layout = getLayout(screen.layoutKey);
    const daysAhead = Math.round((parseDateKey(show.date).getTime() - parseDateKey(today).getTime()) / 86_400_000);
    const fill = daysAhead < 0 ? 0.35 + rng() * 0.25 : Math.max(0.05, 0.4 - daysAhead * 0.05) + rng() * 0.12;
    for (const cat of layout.categories) {
      for (const row of cat.rows) {
        const seats = row.items.flatMap((it) => (it.kind === 'seat' && !it.seat.blocked ? [it.seat] : []));
        let i = 0;
        while (i < seats.length) {
          if (rng() < fill / 2.2) {
            const size = 1 + Math.floor(rng() * 4);
            const group = seats.slice(i, i + size).map((s) => s.id);
            i += size;
            const price = show.prices[cat.key];
            const createdAt = new Date(parseDateKey(show.date).getTime() - (1 + rng() * 4) * 86_400_000).toISOString();
            db.bookings.push({
              id: `bk-${show.id}-${group[0]}`,
              code: nextBookingCode(db, parseDateKey(show.date).getFullYear()),
              userId: null,
              showId: show.id,
              category: cat.key,
              seats: sortSeatIds(group),
              unitPrice: price,
              subtotal: price * group.length,
              fee: 0,
              total: price * group.length,
              status: 'confirmed',
              paymentMethod: 'counter',
              paymentStatus: 'paid',
              paymentRef: null,
              mobile: String(mobileSeq++),
              weekStart: weekStartKey(show.date),
              source: 'counter',
              guestName: GUEST_NAMES[Math.floor(rng() * GUEST_NAMES.length)],
              holdExpiresAt: null,
              createdAt,
            });
          } else i++;
        }
      }
    }
  }
}

function freeSeats(db: DemoDb, show: Show, category: RankCategory, count: number): string[] {
  const taken = new Set(
    db.bookings.filter((b) => b.showId === show.id && b.status === 'confirmed').flatMap((b) => b.seats),
  );
  const screen = db.screens.find((s) => s.id === show.screenId)!;
  const cat = getLayout(screen.layoutKey).categories.find((c) => c.key === category)!;
  for (const row of [...cat.rows].reverse()) {
    const free = row.items.flatMap((it) =>
      it.kind === 'seat' && !it.seat.blocked && !taken.has(it.seat.id) ? [it.seat.id] : [],
    );
    if (free.length >= count) return free.slice(Math.floor((free.length - count) / 2)).slice(0, count);
  }
  return [];
}

/** A few personal bookings for the demo accounts (past + upcoming). */
function seedUserBookings(db: DemoDb) {
  const today = todayKey();
  const thisWeek = weekStartKey(today);
  const make = (userId: string, show: Show | undefined, count: number, method: 'upi' | 'card' | 'counter', status: Booking['status'] = 'confirmed') => {
    if (!show) return;
    const user = db.users.find((u) => u.id === userId)!;
    const seats = freeSeats(db, show, user.rankCategory, count);
    if (!seats.length) return;
    const price = show.prices[user.rankCategory];
    db.bookings.push({
      id: `bk-${userId}-${show.id}`,
      code: nextBookingCode(db),
      userId,
      showId: show.id,
      category: user.rankCategory,
      seats: sortSeatIds(seats),
      unitPrice: price,
      subtotal: price * seats.length,
      fee: 0,
      total: price * seats.length,
      status,
      paymentMethod: method,
      paymentStatus: status === 'cancelled' ? 'refunded' : method === 'counter' ? 'pay_at_counter' : 'paid',
      paymentRef: method === 'counter' ? null : `SIM-${hashString(show.id + userId).toString(36).toUpperCase()}`,
      mobile: user.mobile,
      weekStart: weekStartKey(show.date),
      source: 'online',
      holdExpiresAt: null,
      createdAt: new Date(parseDateKey(show.date).getTime() - 2 * 86_400_000).toISOString(),
      cancelledAt: status === 'cancelled' ? new Date(parseDateKey(show.date).getTime() - 86_400_000).toISOString() : null,
    });
  };
  const byTheatre = (theatreId: string) =>
    db.shows.filter((s) => s.theatreId === theatreId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = (list: Show[]) => list.filter((s) => s.date < thisWeek);
  const nowIso = new Date();
  const upcoming = (list: Show[]) =>
    list.filter((s) => s.date >= today && weekStartKey(s.date) === thisWeek && new Date(`${s.date}T${s.time}`) > nowIso);

  const kerketta = byTheatre('th-kerketta');

  make('u-arjun', past(kerketta).at(-2), 2, 'upi');
  make('u-arjun', past(kerketta).at(-7), 3, 'card');
  make('u-manoj', past(kerketta).at(-3), 4, 'counter');
  make('u-manoj', past(kerketta).at(-5), 2, 'upi', 'cancelled');
  // Rakesh already has a ticket this week → demonstrates the weekly limit
  make('u-rakesh', upcoming(kerketta)[0], 3, 'upi');
  make('u-rakesh', past(kerketta).at(-1), 2, 'card');
}

async function createSeedDb(): Promise<DemoDb> {
  const today = todayKey();
  const users: StoredUser[] = await Promise.all(
    SEED_USERS.map(async ({ password, ...u }) => {
      const salt = randomSalt();
      return { ...u, salt, hash: await hashPassword(password, salt) };
    }),
  );
  // Keep upcoming demo titles in the future relative to when the demo is opened.
  const movies = SEED_MOVIES.map((m, i) =>
    m.status === 'upcoming' ? { ...m, releaseDate: addDays(today, 20 + i * 7) } : { ...m },
  );
  const db: DemoDb = {
    version: DB_VERSION,
    generatedThrough: addDays(today, -22),
    movies,
    theatres: SEED_THEATRES.map((t) => ({ ...t })),
    screens: SEED_SCREENS.map((s) => ({ ...s })),
    shows: [],
    users,
    bookings: [],
    counter: 100,
    otps: [],
  };
  ensureShows(db);
  seedCounterBookings(db);
  seedUserBookings(db);
  return db;
}

/* --------------------------------- access --------------------------------- */

function readFromStorage(): DemoDb | null {
  const db = safeStorage.get<DemoDb | null>(DB_KEY, null);
  return db && db.version === DB_VERSION ? db : null;
}

export async function loadDb(): Promise<DemoDb> {
  if (cache) {
    if (ensureShows(cache)) persist(cache);
    return cache;
  }
  const stored = readFromStorage();
  if (stored) {
    cache = stored;
    if (ensureShows(cache)) persist(cache);
    return cache;
  }
  seeding ??= createSeedDb().then((db) => {
    cache = db;
    persist(db);
    seeding = null;
    return db;
  });
  return seeding;
}

/** Re-reads storage right before a write so concurrent tabs can't double-book. */
export async function loadFreshDb(): Promise<DemoDb> {
  const stored = readFromStorage();
  if (stored) cache = stored;
  return loadDb();
}

function persist(db: DemoDb) {
  if (!safeStorage.set(DB_KEY, db)) {
    // Storage full or blocked: keep working in memory for this tab.
    if (import.meta.env.DEV) console.warn('Demo data could not be saved to localStorage');
  }
}

export function saveDb(db: DemoDb) {
  cache = db;
  persist(db);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetDemoData() {
  safeStorage.remove(DB_KEY);
  cache = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      cache = null;
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  });
}

