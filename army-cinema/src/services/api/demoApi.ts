import { hashPassword, randomId, randomOtp, randomSalt } from '@/lib/crypto';
import { addDays, dateKey, isShowPast, parseDateKey, todayKey, weekStartKey } from '@/lib/date';
import { slugify } from '@/lib/format';
import { cleanText, normalizeMobile, normalizeServiceId } from '@/lib/sanitize';
import { isValidEmail, isValidMobile, isValidName, isValidServiceId, passwordIssues } from '@/lib/validation';
import { safeStorage } from '@/lib/storage';
import { bookableSeatCount, MAX_SEATS_PER_BOOKING, seatIndex, sortSeatIds } from '@/data/layouts';
import { MOCK_REGISTRY } from '@/data/seed';
import { AppError } from '@/services/errors';
import type {
  Booking,
  BookingDetails,
  DashboardStats,
  Movie,
  Profile,
  RankCategory,
  Session,
  Show,
  ShowWithRefs,
  Theatre,
} from '@/types';
import { loadDb, loadFreshDb, nextBookingCode, saveDb, type DemoDb, type StoredUser } from './demoStore';
import type { Api, BookingFilter, ShowFilter, VerificationResult } from './types';

const SESSION_KEY = 'vc:session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const HOLD_MS = 10 * 60 * 1000; // seats are held for 10 minutes during checkout
const OTP_TTL_MS = 5 * 60 * 1000;

/* -------------------------------- helpers -------------------------------- */

async function latency(min = 120, max = 320) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AppError('NETWORK');
  await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

function toProfile(u: StoredUser): Profile {
  // Never hand the password hash or salt to the UI.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { salt, hash, ...profile } = u;
  return profile;
}

function readSession(): Session | null {
  return safeStorage.get<Session | null>(SESSION_KEY, null);
}

function writeSession(userId: string) {
  safeStorage.set(SESSION_KEY, { userId, expiresAt: Date.now() + SESSION_TTL_MS } satisfies Session);
}

function currentUser(db: DemoDb): StoredUser {
  const s = readSession();
  if (!s) throw new AppError('AUTH_REQUIRED');
  if (s.expiresAt < Date.now()) {
    safeStorage.remove(SESSION_KEY);
    throw new AppError('SESSION_EXPIRED');
  }
  const u = db.users.find((x) => x.id === s.userId);
  if (!u) {
    safeStorage.remove(SESSION_KEY);
    throw new AppError('AUTH_REQUIRED');
  }
  return u;
}

function requireAdmin(db: DemoDb): StoredUser {
  const u = currentUser(db);
  if (u.role !== 'admin') throw new AppError('FORBIDDEN');
  return u;
}

function findByIdentifier(db: DemoDb, identifier: string): StoredUser | undefined {
  const raw = identifier.trim();
  const sid = normalizeServiceId(raw);
  const mobile = normalizeMobile(raw);
  const email = raw.toLowerCase();
  return db.users.find(
    (u) => u.serviceId === sid || (mobile.length === 10 && u.mobile === mobile) || u.email.toLowerCase() === email,
  );
}

function holdActive(b: Booking, now = Date.now()) {
  return b.status === 'held' && !!b.holdExpiresAt && new Date(b.holdExpiresAt).getTime() > now;
}

/** Marks expired holds so their seats are released. */
function sweepHolds(db: DemoDb): boolean {
  let changed = false;
  const now = Date.now();
  for (const b of db.bookings) {
    if (b.status === 'held' && !holdActive(b, now)) {
      b.status = 'expired';
      changed = true;
    }
  }
  return changed;
}

function occupied(db: DemoDb, showId: string, exceptBookingId?: string): Set<string> {
  const set = new Set<string>();
  for (const b of db.bookings) {
    if (b.showId !== showId || b.id === exceptBookingId) continue;
    if (b.status === 'confirmed' || holdActive(b)) b.seats.forEach((s) => set.add(s));
  }
  return set;
}

function layoutFor(db: DemoDb, show: Show) {
  const screen = db.screens.find((s) => s.id === show.screenId);
  return screen?.layoutKey ?? 'compact';
}

function withRefs(db: DemoDb, show: Show): ShowWithRefs | null {
  const movie = db.movies.find((m) => m.id === show.movieId);
  const theatre = db.theatres.find((t) => t.id === show.theatreId);
  if (!movie || !theatre) return null;
  const key = layoutFor(db, show);
  const total = bookableSeatCount(key);
  return { ...show, movie, theatre, seatsTotal: total, seatsAvailable: Math.max(0, total - occupied(db, show.id).size) };
}

function details(db: DemoDb, b: Booking): BookingDetails | null {
  const show = db.shows.find((s) => s.id === b.showId);
  if (!show) return null;
  const movie = db.movies.find((m) => m.id === show.movieId);
  const theatre = db.theatres.find((t) => t.id === show.theatreId);
  if (!movie || !theatre) return null;
  const user = b.userId ? db.users.find((u) => u.id === b.userId) : null;
  const customerName = user ? `${user.rankTitle} ${user.fullName}`.trim() : (b.guestName ?? 'Counter booking');
  return { ...b, show, movie, theatre, customerName };
}

function checkRegistry(serviceId: string, fullName: string): VerificationResult {
  const sid = normalizeServiceId(serviceId);
  if (!isValidServiceId(sid)) {
    return { status: 'rejected', message: 'This doesn’t look like a valid Service ID format.' };
  }
  const entry = MOCK_REGISTRY.find((r) => r.serviceId === sid);
  if (!entry) {
    return {
      status: 'pending',
      message: 'We couldn’t auto-verify this Service ID. Your account will be reviewed by the station admin.',
    };
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  if (norm(entry.fullName) !== norm(fullName)) {
    return { status: 'rejected', message: 'The name doesn’t match the service record for this ID.' };
  }
  return {
    status: 'verified',
    rankTitle: entry.rankTitle,
    rankCategory: entry.rankCategory,
    message: 'Service details verified (demo registry).',
  };
}

function uniqueSlug(base: string, taken: string[]): string {
  let slug = slugify(base) || 'item';
  let i = 2;
  while (taken.includes(slug)) slug = `${slugify(base)}-${i++}`;
  return slug;
}

async function resizeImage(file: File, maxWidth = 640): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new AppError('VALIDATION', 'That image could not be read. Try a JPG, PNG or WebP file.'));
      el.src = url;
    });
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', 0.85);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------------------------------- API ---------------------------------- */

export const demoApi: Api = {
  mode: 'demo',

  /* ------------------------------ auth ------------------------------ */

  async getCurrentUser() {
    const s = readSession();
    if (!s) return null;
    const db = await loadDb();
    const u = currentUser(db); // throws SESSION_EXPIRED when stale
    writeSession(u.id); // sliding expiry
    return toProfile(u);
  },

  async login(identifier, password) {
    await latency(250, 500);
    const db = await loadDb();
    const u = findByIdentifier(db, identifier);
    // Same error for unknown user and wrong password (no account enumeration).
    if (!u || (await hashPassword(password, u.salt)) !== u.hash) throw new AppError('AUTH_INVALID');
    writeSession(u.id);
    return toProfile(u);
  },

  async requestOtp(identifier) {
    await latency();
    const db = await loadDb();
    const u = findByIdentifier(db, identifier);
    if (!u) return { channel: 'your registered mobile' }; // don't reveal whether the account exists
    const code = randomOtp();
    db.otps = db.otps.filter((o) => o.userId !== u.id || o.purpose !== 'login');
    db.otps.push({ userId: u.id, code, purpose: 'login', expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    saveDb(db);
    return { channel: `mobile ending ${u.mobile.slice(-2)}`, demoCode: code };
  },

  async verifyOtp(identifier, code) {
    await latency();
    const db = await loadDb();
    const u = findByIdentifier(db, identifier);
    const otp = u && db.otps.find((o) => o.userId === u.id && o.purpose === 'login');
    if (!u || !otp || otp.expiresAt < Date.now() || otp.attempts >= 5) throw new AppError('OTP_INVALID');
    if (otp.code !== code.trim()) {
      otp.attempts++;
      saveDb(db);
      throw new AppError('OTP_INVALID');
    }
    db.otps = db.otps.filter((o) => o !== otp);
    saveDb(db);
    writeSession(u.id);
    return toProfile(u);
  },

  async logout() {
    safeStorage.remove(SESSION_KEY);
  },

  async checkServiceRecord(serviceId, fullName) {
    await latency(400, 800);
    return checkRegistry(serviceId, fullName);
  },

  async register(input) {
    await latency(400, 700);
    const fullName = cleanText(input.fullName, 60);
    const serviceId = normalizeServiceId(input.serviceId);
    const mobile = normalizeMobile(input.mobile);
    const email = input.email.trim().toLowerCase();
    if (!isValidName(fullName) || !isValidServiceId(serviceId) || !isValidMobile(mobile) || !isValidEmail(email) || passwordIssues(input.password)) {
      throw new AppError('VALIDATION');
    }
    const db = await loadFreshDb();
    if (db.users.some((u) => u.serviceId === serviceId || u.mobile === mobile || u.email === email)) {
      throw new AppError('ALREADY_REGISTERED');
    }
    const verification = checkRegistry(serviceId, fullName);
    if (verification.status === 'rejected') throw new AppError('VERIFICATION_FAILED', verification.message);
    const salt = randomSalt();
    const entry = MOCK_REGISTRY.find((r) => r.serviceId === serviceId);
    const user: StoredUser = {
      id: randomId(),
      fullName,
      rankTitle: entry?.rankTitle ?? '',
      serviceId,
      rankCategory: entry?.rankCategory ?? (serviceId.startsWith('IC-') ? 'OFFRS' : serviceId.startsWith('JC-') ? 'JCOS' : 'ORS'),
      unit: entry?.unit,
      mobile,
      email,
      role: 'user',
      verification: verification.status,
      createdAt: new Date().toISOString(),
      salt,
      hash: await hashPassword(input.password, salt),
    };
    db.users.push(user);
    saveDb(db);
    writeSession(user.id);
    return { profile: toProfile(user), verification };
  },

  async requestPasswordReset(identifier) {
    await latency();
    const db = await loadDb();
    const u = findByIdentifier(db, identifier);
    if (!u) return {};
    const code = randomOtp();
    db.otps = db.otps.filter((o) => o.userId !== u.id || o.purpose !== 'reset');
    db.otps.push({ userId: u.id, code, purpose: 'reset', expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    saveDb(db);
    return { demoCode: code };
  },

  async resetPassword(identifier, code, newPassword) {
    await latency();
    if (passwordIssues(newPassword)) throw new AppError('VALIDATION', passwordIssues(newPassword)!);
    const db = await loadDb();
    const u = findByIdentifier(db, identifier);
    const otp = u && db.otps.find((o) => o.userId === u.id && o.purpose === 'reset');
    if (!u || !otp || otp.expiresAt < Date.now() || otp.code !== code.trim()) throw new AppError('OTP_INVALID');
    u.salt = randomSalt();
    u.hash = await hashPassword(newPassword, u.salt);
    db.otps = db.otps.filter((o) => o !== otp);
    saveDb(db);
  },

  async updateProfile(patch) {
    await latency();
    const db = await loadFreshDb();
    const u = currentUser(db);
    if (patch.fullName !== undefined) {
      if (!isValidName(patch.fullName)) throw new AppError('VALIDATION', 'Please enter a valid name.');
      u.fullName = cleanText(patch.fullName, 60);
    }
    if (patch.email !== undefined) {
      const email = patch.email.trim().toLowerCase();
      if (!isValidEmail(email)) throw new AppError('VALIDATION', 'Please enter a valid email.');
      if (db.users.some((x) => x.id !== u.id && x.email === email)) throw new AppError('ALREADY_REGISTERED', 'That email is already in use.');
      u.email = email;
    }
    if (patch.unit !== undefined) u.unit = cleanText(patch.unit, 60);
    saveDb(db);
    return toProfile(u);
  },

  /* ---------------------------- catalogue ---------------------------- */

  async listMovies() {
    await latency(80, 200);
    const db = await loadDb();
    return [...db.movies];
  },

  async getMovieBySlug(slug) {
    await latency(80, 200);
    const db = await loadDb();
    return db.movies.find((m) => m.slug === slug) ?? null;
  },

  async listTheatres() {
    await latency(80, 200);
    const db = await loadDb();
    return [...db.theatres];
  },

  async getTheatreBySlug(slug) {
    await latency(80, 200);
    const db = await loadDb();
    return db.theatres.find((t) => t.slug === slug) ?? null;
  },

  async listShows(filter: ShowFilter = {}) {
    await latency(100, 250);
    const db = await loadDb();
    if (sweepHolds(db)) saveDb(db);
    const now = new Date();
    return db.shows
      .filter((s) => {
        if (filter.movieId && s.movieId !== filter.movieId) return false;
        if (filter.theatreId && s.theatreId !== filter.theatreId) return false;
        if (filter.date && s.date !== filter.date) return false;
        if (filter.from && s.date < filter.from) return false;
        if (filter.to && s.date > filter.to) return false;
        if (!filter.includePast && (s.status !== 'scheduled' || isShowPast(s.date, s.time, now))) return false;
        return true;
      })
      .map((s) => withRefs(db, s))
      .filter((s): s is ShowWithRefs => !!s && (filter.includePast || s.theatre.active))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  },

  async getShow(id) {
    await latency(80, 200);
    const db = await loadDb();
    const s = db.shows.find((x) => x.id === id);
    return s ? withRefs(db, s) : null;
  },

  async getOccupiedSeats(showId) {
    await latency(60, 160);
    const db = await loadFreshDb();
    if (sweepHolds(db)) saveDb(db);
    return [...occupied(db, showId)];
  },

  /* ----------------------------- booking ----------------------------- */

  async holdSeats({ showId, seats }) {
    await latency(250, 450);
    const db = await loadFreshDb(); // fresh read: another tab may have booked
    sweepHolds(db);
    const user = currentUser(db);
    if (user.verification !== 'verified') throw new AppError('NOT_VERIFIED');

    const show = db.shows.find((s) => s.id === showId);
    if (!show || show.status !== 'scheduled' || isShowPast(show.date, show.time)) throw new AppError('SHOW_UNAVAILABLE');
    const theatre = db.theatres.find((t) => t.id === show.theatreId);
    if (!theatre?.active) throw new AppError('SHOW_UNAVAILABLE');

    const unique = [...new Set(seats)];
    if (unique.length === 0) throw new AppError('VALIDATION', 'Please select at least one seat.');
    if (unique.length > MAX_SEATS_PER_BOOKING) throw new AppError('MAX_SEATS');

    const index = seatIndex(layoutFor(db, show));
    const defs = unique.map((id) => index.get(id));
    if (defs.some((d) => !d || d.blocked)) throw new AppError('VALIDATION', 'One of the selected seats can’t be booked.');
    const category = defs[0]!.category;
    if (defs.some((d) => d!.category !== category)) throw new AppError('VALIDATION', 'All seats in a booking must be in the same category.');
    if (user.role !== 'admin' && category !== user.rankCategory) throw new AppError('CATEGORY_NOT_ALLOWED');

    // Release any earlier hold this user left behind (e.g. they went back to change seats).
    for (const b of db.bookings) if (b.userId === user.id && b.status === 'held') b.status = 'cancelled';

    // One booking per mobile number per Fri–Thu week.
    const weekStart = weekStartKey(show.date);
    const existing = db.bookings.find((b) => b.mobile === user.mobile && b.weekStart === weekStart && b.status === 'confirmed');
    if (existing) throw new AppError('WEEKLY_LIMIT', undefined, { bookingId: existing.id, code: existing.code });

    const taken = occupied(db, show.id);
    const clash = unique.filter((s) => taken.has(s));
    if (clash.length) throw new AppError('SEAT_TAKEN', undefined, { seats: clash });

    const unitPrice = show.prices[category];
    const booking: Booking = {
      id: randomId(),
      code: '',
      userId: user.id,
      showId: show.id,
      category,
      seats: sortSeatIds(unique),
      unitPrice,
      subtotal: unitPrice * unique.length,
      fee: 0,
      total: unitPrice * unique.length,
      status: 'held',
      paymentMethod: null,
      paymentStatus: 'unpaid',
      paymentRef: null,
      mobile: user.mobile,
      weekStart,
      source: 'online',
      holdExpiresAt: new Date(Date.now() + HOLD_MS).toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    saveDb(db);
    return booking;
  },

  async confirmBooking(bookingId, payment) {
    await latency(200, 400);
    const db = await loadFreshDb();
    const user = currentUser(db);
    const b = db.bookings.find((x) => x.id === bookingId && x.userId === user.id);
    if (!b) throw new AppError('NOT_FOUND');
    if (b.status === 'confirmed') return details(db, b)!;
    if (!holdActive(b)) {
      if (b.status === 'held') b.status = 'expired';
      saveDb(db);
      throw new AppError('HOLD_EXPIRED');
    }
    // Final guard: same week-lock and seat checks at commit time.
    const dup = db.bookings.find((x) => x.id !== b.id && x.mobile === b.mobile && x.weekStart === b.weekStart && x.status === 'confirmed');
    if (dup) throw new AppError('WEEKLY_LIMIT');
    const clash = b.seats.filter((s) => occupied(db, b.showId, b.id).has(s));
    if (clash.length) throw new AppError('SEAT_TAKEN', undefined, { seats: clash });

    b.status = 'confirmed';
    b.code = nextBookingCode(db);
    b.paymentMethod = payment.method;
    b.paymentStatus = payment.method === 'counter' ? 'pay_at_counter' : payment.paid ? 'paid' : 'unpaid';
    b.paymentRef = payment.reference;
    b.holdExpiresAt = null;
    saveDb(db);
    return details(db, b)!;
  },

  async releaseHold(bookingId, reason = 'cancelled') {
    const db = await loadFreshDb();
    const b = db.bookings.find((x) => x.id === bookingId);
    if (b && b.status === 'held') {
      b.status = reason === 'payment_failed' ? 'payment_failed' : 'cancelled';
      saveDb(db);
    }
  },

  async getBooking(id) {
    await latency(80, 200);
    const db = await loadDb();
    const user = currentUser(db);
    const b = db.bookings.find((x) => x.id === id);
    if (!b || (b.userId !== user.id && user.role !== 'admin')) return null;
    return details(db, b);
  },

  async listMyBookings() {
    await latency();
    const db = await loadDb();
    const user = currentUser(db);
    return db.bookings
      .filter((b) => b.userId === user.id && b.status !== 'held' && b.status !== 'expired')
      .map((b) => details(db, b))
      .filter((b): b is BookingDetails => !!b)
      .sort((a, b) => (b.show.date + b.show.time).localeCompare(a.show.date + a.show.time));
  },

  async cancelBooking(id) {
    await latency(250, 450);
    const db = await loadFreshDb();
    const user = currentUser(db);
    const b = db.bookings.find((x) => x.id === id);
    if (!b || (b.userId !== user.id && user.role !== 'admin')) throw new AppError('NOT_FOUND');
    const show = db.shows.find((s) => s.id === b.showId);
    if (b.status !== 'confirmed') throw new AppError('VALIDATION', 'Only confirmed bookings can be cancelled.');
    if (show && isShowPast(show.date, show.time) && user.role !== 'admin') {
      throw new AppError('VALIDATION', 'This show has already started, so it can’t be cancelled.');
    }
    b.status = 'cancelled';
    b.cancelledAt = new Date().toISOString();
    if (b.paymentStatus === 'paid') b.paymentStatus = 'refunded';
    saveDb(db); // frees the seats and the weekly lock
  },

  async weeklyBookingFor(date) {
    const db = await loadDb();
    let user: StoredUser;
    try {
      user = currentUser(db);
    } catch {
      return null;
    }
    const ws = weekStartKey(date);
    const b = db.bookings.find((x) => x.mobile === user.mobile && x.weekStart === ws && x.status === 'confirmed');
    return b ? details(db, b) : null;
  },

  /* ------------------------------ admin ------------------------------ */

  async adminStats() {
    await latency();
    const db = await loadDb();
    requireAdmin(db);
    const confirmed = db.bookings.filter((b) => b.status === 'confirmed');
    const today = todayKey();
    const byDay = new Map<string, { bookings: number; revenue: number }>();
    for (let i = 13; i >= 0; i--) byDay.set(addDays(today, -i), { bookings: 0, revenue: 0 });
    const byCat: Record<RankCategory, number> = { OFFRS: 0, JCOS: 0, ORS: 0 };
    const perMovie = new Map<string, number>();
    const perDayAll = new Map<string, number>();
    for (const b of confirmed) {
      const day = dateKey(new Date(b.createdAt));
      const slot = byDay.get(day);
      if (slot) {
        slot.bookings++;
        slot.revenue += b.paymentStatus === 'paid' ? b.total : 0;
      }
      perDayAll.set(day, (perDayAll.get(day) ?? 0) + 1);
      byCat[b.category] += b.seats.length;
      const show = db.shows.find((s) => s.id === b.showId);
      if (show) perMovie.set(show.movieId, (perMovie.get(show.movieId) ?? 0) + 1);
    }
    const busiest = [...perDayAll.entries()].sort((a, b) => b[1] - a[1])[0];
    const popular = [...perMovie.entries()].sort((a, b) => b[1] - a[1])[0];
    const now = new Date();
    const upcoming = db.shows
      .filter((s) => s.status === 'scheduled' && !isShowPast(s.date, s.time, now))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 8)
      .map((s) => withRefs(db, s))
      .filter((s): s is ShowWithRefs => !!s);
    const stats: DashboardStats = {
      totalBookings: confirmed.length,
      todaysBookings: confirmed.filter((b) => dateKey(new Date(b.createdAt)) === today).length,
      totalUsers: db.users.filter((u) => u.role === 'user').length,
      pendingVerifications: db.users.filter((u) => u.verification === 'pending').length,
      totalMovies: db.movies.length,
      totalTheatres: db.theatres.length,
      revenue: confirmed.reduce((s, b) => s + (b.paymentStatus === 'paid' ? b.total : 0), 0),
      ticketsSold: confirmed.reduce((s, b) => s + b.seats.length, 0),
      upcomingShows: upcoming,
      bookingsByDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      byCategory: (Object.keys(byCat) as RankCategory[]).map((category) => ({ category, tickets: byCat[category] })),
      busiestDay: busiest ? { date: busiest[0], bookings: busiest[1] } : null,
      popularMovie: popular
        ? { title: db.movies.find((m) => m.id === popular[0])?.title ?? '—', bookings: popular[1] }
        : null,
    };
    return stats;
  },

  async adminListBookings(filter: BookingFilter = {}) {
    await latency();
    const db = await loadDb();
    requireAdmin(db);
    const q = filter.query?.trim().toLowerCase();
    return db.bookings
      .filter((b) => b.status !== 'held' && b.status !== 'expired')
      .filter((b) => !filter.status || filter.status === 'all' || b.status === filter.status)
      .map((b) => details(db, b))
      .filter((b): b is BookingDetails => !!b)
      .filter((b) => !filter.date || b.show.date === filter.date)
      .filter((b) => !filter.theatreId || b.theatre.id === filter.theatreId)
      .filter(
        (b) =>
          !q ||
          b.code.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.mobile.includes(q) ||
          b.movie.title.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async adminListUsers() {
    await latency();
    const db = await loadDb();
    requireAdmin(db);
    return db.users.map(toProfile).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async adminSetVerification(userId, status) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new AppError('NOT_FOUND');
    u.verification = status;
    saveDb(db);
  },

  async saveMovie(input, id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const clean: Omit<Movie, 'id' | 'createdAt' | 'slug'> = {
      ...input,
      title: cleanText(input.title, 80),
      tagline: input.tagline ? cleanText(input.tagline, 120) : '',
      description: cleanText(input.description, 1200),
      genres: input.genres.map((g) => cleanText(g, 24)).filter(Boolean).slice(0, 5),
      language: cleanText(input.language, 30),
      director: cleanText(input.director, 60),
      cast: input.cast.map((c) => cleanText(c, 60)).filter(Boolean).slice(0, 12),
      certification: cleanText(input.certification, 12),
    };
    if (!clean.title) throw new AppError('VALIDATION', 'Title is required.');
    if (id) {
      const m = db.movies.find((x) => x.id === id);
      if (!m) throw new AppError('NOT_FOUND');
      Object.assign(m, clean);
      if (input.slug && input.slug !== m.slug) m.slug = uniqueSlug(input.slug, db.movies.filter((x) => x.id !== id).map((x) => x.slug));
      saveDb(db);
      return m;
    }
    const movie: Movie = {
      ...clean,
      id: randomId(),
      slug: uniqueSlug(input.slug || clean.title, db.movies.map((x) => x.slug)),
      createdAt: new Date().toISOString(),
    };
    db.movies.push(movie);
    saveDb(db);
    return movie;
  },

  async deleteMovie(id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const showIds = new Set(db.shows.filter((s) => s.movieId === id).map((s) => s.id));
    if (db.bookings.some((b) => showIds.has(b.showId) && b.status !== 'expired')) {
      throw new AppError('CONFLICT', 'This movie has booking history, so it can’t be deleted. Set its status to “Archived” instead.');
    }
    db.shows = db.shows.filter((s) => s.movieId !== id);
    db.movies = db.movies.filter((m) => m.id !== id);
    saveDb(db);
  },

  async uploadPoster(file) {
    await latency();
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      throw new AppError('VALIDATION', 'Please upload a JPG, PNG, WebP or AVIF image.');
    }
    if (file.size > 8 * 1024 * 1024) throw new AppError('VALIDATION', 'Please upload an image under 8 MB.');
    return resizeImage(file);
  },

  async saveTheatre(input, id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const clean = {
      ...input,
      name: cleanText(input.name, 80),
      location: cleanText(input.location, 80),
      city: cleanText(input.city, 60),
      description: cleanText(input.description, 600),
      facilities: input.facilities.map((f) => cleanText(f, 30)).filter(Boolean).slice(0, 8),
    };
    if (!clean.name) throw new AppError('VALIDATION', 'Theatre name is required.');
    if (id) {
      const t = db.theatres.find((x) => x.id === id);
      if (!t) throw new AppError('NOT_FOUND');
      if (t.layoutKey !== clean.layoutKey) {
        const showIds = new Set(db.shows.filter((s) => s.theatreId === id).map((s) => s.id));
        if (db.bookings.some((b) => showIds.has(b.showId) && b.status === 'confirmed')) {
          throw new AppError('CONFLICT', 'The seat layout can’t change while this theatre has bookings.');
        }
        db.screens.filter((s) => s.theatreId === id).forEach((s) => (s.layoutKey = clean.layoutKey));
      }
      Object.assign(t, clean);
      saveDb(db);
      return t;
    }
    const theatre: Theatre = {
      ...clean,
      id: randomId(),
      slug: uniqueSlug(input.slug || clean.name, db.theatres.map((x) => x.slug)),
      createdAt: new Date().toISOString(),
    };
    db.theatres.push(theatre);
    db.screens.push({ id: randomId(), theatreId: theatre.id, name: 'Main Hall', layoutKey: theatre.layoutKey });
    saveDb(db);
    return theatre;
  },

  async deleteTheatre(id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const showIds = new Set(db.shows.filter((s) => s.theatreId === id).map((s) => s.id));
    if (db.bookings.some((b) => showIds.has(b.showId) && b.status !== 'expired')) {
      throw new AppError('CONFLICT', 'This theatre has booking history, so it can’t be deleted. Mark it inactive instead.');
    }
    db.shows = db.shows.filter((s) => s.theatreId !== id);
    db.screens = db.screens.filter((s) => s.theatreId !== id);
    db.theatres = db.theatres.filter((t) => t.id !== id);
    saveDb(db);
  },

  async listScreens() {
    const db = await loadDb();
    return [...db.screens];
  },

  async saveShow(input, id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const screen = db.screens.find((s) => s.theatreId === input.theatreId);
    if (!screen || !db.movies.some((m) => m.id === input.movieId)) throw new AppError('VALIDATION', 'Choose a valid movie and theatre.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) throw new AppError('VALIDATION', 'Enter a valid date and time.');
    if (Object.values(input.prices).some((p) => !Number.isFinite(p) || p < 0 || p > 5000)) {
      throw new AppError('VALIDATION', 'Ticket prices must be between ₹0 and ₹5,000.');
    }
    if (db.shows.some((s) => s.id !== id && s.screenId === screen.id && s.date === input.date && s.time === input.time && s.status === 'scheduled')) {
      throw new AppError('CONFLICT', 'Another show is already scheduled on this screen at that time.');
    }
    if (id) {
      const s = db.shows.find((x) => x.id === id);
      if (!s) throw new AppError('NOT_FOUND');
      const hasBookings = db.bookings.some((b) => b.showId === id && b.status === 'confirmed');
      if (hasBookings && (s.date !== input.date || s.time !== input.time || s.theatreId !== input.theatreId || s.movieId !== input.movieId)) {
        throw new AppError('CONFLICT', 'This show has bookings, so only prices can be changed. Cancel it and create a new one instead.');
      }
      Object.assign(s, { ...input, screenId: screen.id, status: input.status ?? s.status });
      saveDb(db);
      return s;
    }
    if (isShowPast(input.date, input.time)) throw new AppError('VALIDATION', 'New shows must be in the future.');
    const show: Show = {
      id: randomId(),
      movieId: input.movieId,
      theatreId: input.theatreId,
      screenId: screen.id,
      date: input.date,
      time: input.time,
      prices: input.prices,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    db.shows.push(show);
    saveDb(db);
    return show;
  },

  async deleteShow(id) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const show = db.shows.find((s) => s.id === id);
    if (!show) throw new AppError('NOT_FOUND');
    const related = db.bookings.filter((b) => b.showId === id && (b.status === 'confirmed' || b.status === 'held'));
    if (!related.length && !db.bookings.some((b) => b.showId === id)) {
      db.shows = db.shows.filter((s) => s.id !== id);
      saveDb(db);
      return 'deleted';
    }
    show.status = 'cancelled';
    const now = new Date().toISOString();
    for (const b of related) {
      b.status = 'cancelled';
      b.cancelledAt = now;
      if (b.paymentStatus === 'paid') b.paymentStatus = 'refunded';
    }
    saveDb(db);
    return 'cancelled';
  },

  async generateShows(theatreId, movieId, from, days, prices) {
    await latency();
    const db = await loadFreshDb();
    requireAdmin(db);
    const theatre = db.theatres.find((t) => t.id === theatreId);
    const screen = db.screens.find((s) => s.theatreId === theatreId);
    if (!theatre || !screen || !db.movies.some((m) => m.id === movieId)) throw new AppError('VALIDATION', 'Choose a valid movie and theatre.');
    let added = 0;
    for (let i = 0; i < Math.min(days, 28); i++) {
      const date = addDays(from, i);
      for (const time of theatre.weeklySchedule[parseDateKey(date).getDay()] ?? []) {
        if (isShowPast(date, time)) continue;
        if (db.shows.some((s) => s.screenId === screen.id && s.date === date && s.time === time && s.status === 'scheduled')) continue;
        db.shows.push({
          id: randomId(),
          movieId,
          theatreId,
          screenId: screen.id,
          date,
          time,
          prices: { ...prices },
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        });
        added++;
      }
    }
    saveDb(db);
    return added;
  },
};

