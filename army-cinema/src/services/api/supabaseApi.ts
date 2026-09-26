import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { addDays, dateKey, isShowPast, parseDateKey, todayKey } from '@/lib/date';
import { slugify } from '@/lib/format';
import { cleanText, normalizeMobile, normalizeServiceId } from '@/lib/sanitize';
import { AppError, type ErrorCode } from '@/services/errors';
import { seatIndex } from '@/data/layouts';
import type {
  Booking,
  BookingDetails,
  DashboardStats,
  Movie,
  Profile,
  RankCategory,
  Screen,
  Show,
  ShowWithRefs,
  Theatre,
} from '@/types';
import type { Api, ShowFilter, VerificationResult } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const bucket = (import.meta.env.VITE_SUPABASE_POSTER_BUCKET as string) || 'posters';

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

const KNOWN: ErrorCode[] = [
  'AUTH_REQUIRED', 'NOT_VERIFIED', 'VERIFICATION_FAILED', 'SEAT_TAKEN', 'WEEKLY_LIMIT', 'MAX_SEATS',
  'CATEGORY_NOT_ALLOWED', 'SHOW_UNAVAILABLE', 'HOLD_EXPIRED', 'NOT_FOUND', 'FORBIDDEN', 'VALIDATION',
];

/** Maps Postgres / Supabase errors to friendly AppErrors (never shows raw errors). */
function fail(error: { message?: string; code?: string } | null): never {
  const msg = error?.message ?? '';
  const known = KNOWN.find((k) => msg.includes(k));
  if (known) throw new AppError(known);
  if (error?.code === '23505') throw new AppError('CONFLICT');
  if (error?.code === '23503') throw new AppError('CONFLICT', 'This item is linked to existing bookings and can’t be removed.');
  if (/JWT|session/i.test(msg)) throw new AppError('SESSION_EXPIRED');
  if (/Invalid login credentials/i.test(msg)) throw new AppError('AUTH_INVALID');
  if (/already registered|already exists/i.test(msg)) throw new AppError('ALREADY_REGISTERED');
  if (/fetch|network/i.test(msg)) throw new AppError('NETWORK');
  if (import.meta.env.DEV) console.error(error);
  throw new AppError('UNKNOWN');
}

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) fail(error);
  return data as T;
}

/* -------------------------------- mappers -------------------------------- */

const toMovie = (r: Row): Movie => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  tagline: r.tagline ?? '',
  description: r.description,
  genres: r.genres ?? [],
  language: r.language,
  durationMin: r.duration_min,
  certification: r.certification,
  score: r.score,
  releaseDate: r.release_date,
  director: r.director,
  cast: r.cast_members ?? [],
  posterUrl: r.poster_url,
  trailerUrl: r.trailer_url,
  status: r.status,
  featured: r.featured,
  palette: (r.palette ?? ['#1e3a5f', '#050b18']) as [string, string],
  createdAt: r.created_at,
});

const fromMovie = (m: Partial<Movie>): Row => ({
  slug: m.slug,
  title: m.title,
  tagline: m.tagline,
  description: m.description,
  genres: m.genres,
  language: m.language,
  duration_min: m.durationMin,
  certification: m.certification,
  score: m.score ?? null,
  release_date: m.releaseDate,
  director: m.director,
  cast_members: m.cast,
  poster_url: m.posterUrl ?? null,
  trailer_url: m.trailerUrl ?? null,
  status: m.status,
  featured: m.featured,
  palette: m.palette,
});

const toTheatre = (r: Row): Theatre => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  location: r.location,
  city: r.city,
  description: r.description,
  facilities: r.facilities ?? [],
  layoutKey: r.layout_key,
  weeklySchedule: r.weekly_schedule ?? {},
  active: r.active,
  createdAt: r.created_at,
});

const toShow = (r: Row): Show => ({
  id: r.id,
  movieId: r.movie_id,
  theatreId: r.theatre_id,
  screenId: r.screen_id,
  date: r.show_date,
  time: String(r.show_time).slice(0, 5),
  prices: { OFFRS: r.price_offrs, JCOS: r.price_jcos, ORS: r.price_ors },
  status: r.status,
  createdAt: r.created_at,
});

const toBooking = (r: Row): Booking => ({
  id: r.id,
  code: r.code ?? '',
  userId: r.user_id,
  showId: r.show_id,
  category: r.category,
  seats: r.seat_codes ?? [],
  unitPrice: r.unit_price,
  subtotal: r.subtotal,
  fee: r.fee,
  total: r.total,
  status: r.status,
  paymentMethod: r.payment_method,
  paymentStatus: r.payment_status,
  paymentRef: r.payment_ref,
  mobile: r.mobile,
  weekStart: r.week_start,
  source: r.source,
  guestName: r.guest_name,
  holdExpiresAt: r.hold_expires_at,
  createdAt: r.created_at,
  cancelledAt: r.cancelled_at,
});

const toProfile = (r: Row, isAdmin: boolean): Profile => ({
  id: r.id,
  fullName: r.full_name,
  rankTitle: r.rank_title,
  serviceId: r.service_id,
  rankCategory: r.rank_category,
  unit: r.unit ?? undefined,
  mobile: r.mobile,
  email: r.email,
  role: isAdmin ? 'admin' : 'user',
  verification: r.verification,
  createdAt: r.created_at,
});

const SHOW_SELECT = '*, movie:movies(*), theatre:theatres(*)';
const BOOKING_SELECT = '*, profile:profiles(full_name, rank_title), show:shows(*, movie:movies(*), theatre:theatres(*))';

async function withCounts(rows: Row[]): Promise<ShowWithRefs[]> {
  if (!rows.length) return [];
  const counts = await unwrap<Row[]>(sb().rpc('show_seat_counts', { p_show_ids: rows.map((r) => r.id) }));
  const byId = new Map(counts.map((c) => [c.show_id, c]));
  return rows.map((r) => {
    const c = byId.get(r.id);
    const total = c?.total ?? 0;
    return { ...toShow(r), movie: toMovie(r.movie), theatre: toTheatre(r.theatre), seatsTotal: total, seatsAvailable: Math.max(0, total - (c?.taken ?? 0)) };
  });
}

function toDetails(r: Row): BookingDetails {
  const b = toBooking(r);
  const name = r.profile ? `${r.profile.rank_title ?? ''} ${r.profile.full_name}`.trim() : (r.guest_name ?? 'Counter booking');
  return { ...b, show: toShow(r.show), movie: toMovie(r.show.movie), theatre: toTheatre(r.show.theatre), customerName: name };
}

async function resolveEmail(identifier: string): Promise<string> {
  if (identifier.includes('@')) return identifier.trim().toLowerCase();
  const email = await unwrap<string | null>(sb().rpc('resolve_login_email', { p_identifier: identifier }));
  if (!email) throw new AppError('AUTH_INVALID');
  return email;
}

async function me(): Promise<Profile> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new AppError('AUTH_REQUIRED');
  const [profile, admin] = await Promise.all([
    unwrap<Row | null>(sb().from('profiles').select('*').eq('id', data.user.id).maybeSingle()),
    unwrap<Row | null>(sb().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle()),
  ]);
  if (!profile) throw new AppError('AUTH_REQUIRED');
  return toProfile(profile, !!admin);
}

/* ---------------------------------- API ---------------------------------- */

export const supabaseApi: Api = {
  mode: 'supabase',

  async getCurrentUser() {
    const { data } = await sb().auth.getSession();
    if (!data.session) return null;
    if (data.session.expires_at && data.session.expires_at * 1000 < Date.now()) {
      const { error } = await sb().auth.refreshSession();
      if (error) throw new AppError('SESSION_EXPIRED');
    }
    return me();
  },

  async login(identifier, password) {
    const email = await resolveEmail(identifier);
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) fail(error);
    return me();
  },

  async requestOtp(identifier) {
    let email: string;
    try {
      email = await resolveEmail(identifier);
    } catch {
      return { channel: 'your registered email' };
    }
    const { error } = await sb().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) fail(error);
    return { channel: 'your registered email' };
  },

  async verifyOtp(identifier, code) {
    const email = await resolveEmail(identifier);
    const { error } = await sb().auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    if (error) throw new AppError('OTP_INVALID');
    return me();
  },

  async logout() {
    await sb().auth.signOut();
  },

  async checkServiceRecord(serviceId, fullName) {
    return unwrap<VerificationResult>(sb().rpc('check_service_record', { p_service_id: serviceId, p_full_name: fullName }));
  },

  async register(input) {
    const verification = await this.checkServiceRecord(input.serviceId, input.fullName);
    if (verification.status === 'rejected') throw new AppError('VERIFICATION_FAILED', verification.message);
    const { data, error } = await sb().auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: cleanText(input.fullName, 60),
          service_id: normalizeServiceId(input.serviceId),
          mobile: normalizeMobile(input.mobile),
        },
      },
    });
    if (error) fail(error);
    if (!data.session) {
      // Email confirmation is switched on in Supabase Auth settings.
      throw new AppError('VALIDATION', 'Account created. Please confirm your email address, then log in.');
    }
    return { profile: await me(), verification };
  },

  async requestPasswordReset(identifier) {
    try {
      const email = await resolveEmail(identifier);
      await sb().auth.resetPasswordForEmail(email);
    } catch {
      /* don't reveal whether the account exists */
    }
    return {};
  },

  async resetPassword(identifier, code, newPassword) {
    const email = await resolveEmail(identifier);
    const { error } = await sb().auth.verifyOtp({ email, token: code.trim(), type: 'recovery' });
    if (error) throw new AppError('OTP_INVALID');
    const res = await sb().auth.updateUser({ password: newPassword });
    if (res.error) fail(res.error);
  },

  async updateProfile(patch) {
    const current = await me();
    const row: Row = {};
    if (patch.fullName !== undefined) row.full_name = cleanText(patch.fullName, 60);
    if (patch.unit !== undefined) row.unit = cleanText(patch.unit, 60);
    if (patch.email !== undefined) {
      const { error } = await sb().auth.updateUser({ email: patch.email.trim().toLowerCase() });
      if (error) fail(error);
    }
    if (Object.keys(row).length) await unwrap(sb().from('profiles').update(row).eq('id', current.id));
    return me();
  },

  async listMovies() {
    return (await unwrap<Row[]>(sb().from('movies').select('*').order('release_date', { ascending: false }))).map(toMovie);
  },

  async getMovieBySlug(slug) {
    const r = await unwrap<Row | null>(sb().from('movies').select('*').eq('slug', slug).maybeSingle());
    return r ? toMovie(r) : null;
  },

  async listTheatres() {
    return (await unwrap<Row[]>(sb().from('theatres').select('*').order('name'))).map(toTheatre);
  },

  async getTheatreBySlug(slug) {
    const r = await unwrap<Row | null>(sb().from('theatres').select('*').eq('slug', slug).maybeSingle());
    return r ? toTheatre(r) : null;
  },

  async listShows(filter: ShowFilter = {}) {
    let q = sb().from('shows').select(SHOW_SELECT).order('show_date').order('show_time');
    if (filter.movieId) q = q.eq('movie_id', filter.movieId);
    if (filter.theatreId) q = q.eq('theatre_id', filter.theatreId);
    if (filter.date) q = q.eq('show_date', filter.date);
    if (filter.from) q = q.gte('show_date', filter.from);
    if (filter.to) q = q.lte('show_date', filter.to);
    if (!filter.includePast) q = q.eq('status', 'scheduled').gte('show_date', todayKey());
    let rows = await unwrap<Row[]>(q.limit(500));
    if (!filter.includePast) rows = rows.filter((r) => r.theatre?.active && !isShowPast(r.show_date, String(r.show_time).slice(0, 5)));
    return withCounts(rows);
  },

  async getShow(id) {
    const r = await unwrap<Row | null>(sb().from('shows').select(SHOW_SELECT).eq('id', id).maybeSingle());
    return r ? (await withCounts([r]))[0] : null;
  },

  async getOccupiedSeats(showId) {
    const rows = await unwrap<string[]>(sb().rpc('occupied_seats', { p_show_id: showId }));
    return rows.map((r) => (typeof r === 'string' ? r : (r as Row).occupied_seats));
  },

  async holdSeats({ showId, seats }) {
    return toBooking(await unwrap<Row>(sb().rpc('hold_seats', { p_show_id: showId, p_seats: seats })));
  },

  async confirmBooking(bookingId, payment) {
    await unwrap(sb().rpc('confirm_booking', { p_booking_id: bookingId, p_method: payment.method, p_reference: payment.reference, p_paid: payment.paid }));
    const b = await this.getBooking(bookingId);
    if (!b) throw new AppError('NOT_FOUND');
    return b;
  },

  async releaseHold(bookingId, reason = 'cancelled') {
    await sb().rpc('release_hold', { p_booking_id: bookingId, p_reason: reason });
  },

  async getBooking(id) {
    const r = await unwrap<Row | null>(sb().from('bookings').select(BOOKING_SELECT).eq('id', id).maybeSingle());
    return r ? toDetails(r) : null;
  },

  async listMyBookings() {
    const user = await me();
    const rows = await unwrap<Row[]>(
      sb().from('bookings').select(BOOKING_SELECT).eq('user_id', user.id).not('status', 'in', '(held,expired)').order('created_at', { ascending: false }),
    );
    return rows.map(toDetails).sort((a, b) => (b.show.date + b.show.time).localeCompare(a.show.date + a.show.time));
  },

  async cancelBooking(id) {
    await unwrap(sb().rpc('cancel_booking', { p_booking_id: id }));
  },

  async weeklyBookingFor(date) {
    const { data } = await sb().auth.getSession();
    if (!data.session) return null;
    const user = await me();
    const d = parseDateKey(date);
    const ws = dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() - 5 + 7) % 7)));
    const r = await unwrap<Row | null>(
      sb().from('bookings').select(BOOKING_SELECT).eq('mobile', user.mobile).eq('week_start', ws).eq('status', 'confirmed').maybeSingle(),
    );
    return r ? toDetails(r) : null;
  },

  async adminStats() {
    const today = todayKey();
    const [bookings, users, movies, theatres, upcoming] = await Promise.all([
      unwrap<Row[]>(sb().from('bookings').select('id, category, seat_codes, total, payment_status, created_at, show:shows(movie_id, movie:movies(title))').eq('status', 'confirmed').limit(10000)),
      unwrap<Row[]>(sb().from('profiles').select('id, verification')),
      unwrap<Row[]>(sb().from('movies').select('id')),
      unwrap<Row[]>(sb().from('theatres').select('id')),
      this.listShows({ from: today, to: addDays(today, 7) }),
    ]);
    const byDay = new Map<string, { bookings: number; revenue: number }>();
    for (let i = 13; i >= 0; i--) byDay.set(addDays(today, -i), { bookings: 0, revenue: 0 });
    const perDay = new Map<string, number>();
    const perMovie = new Map<string, number>();
    const byCat: Record<RankCategory, number> = { OFFRS: 0, JCOS: 0, ORS: 0 };
    let revenue = 0;
    let tickets = 0;
    for (const b of bookings) {
      const day = dateKey(new Date(b.created_at));
      const paid = b.payment_status === 'paid' ? b.total : 0;
      const slot = byDay.get(day);
      if (slot) {
        slot.bookings++;
        slot.revenue += paid;
      }
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
      const title = b.show?.movie?.title ?? '—';
      perMovie.set(title, (perMovie.get(title) ?? 0) + 1);
      byCat[b.category as RankCategory] += b.seat_codes.length;
      revenue += paid;
      tickets += b.seat_codes.length;
    }
    const busiest = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0];
    const popular = [...perMovie.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      totalBookings: bookings.length,
      todaysBookings: bookings.filter((b) => dateKey(new Date(b.created_at)) === today).length,
      totalUsers: users.length,
      pendingVerifications: users.filter((u) => u.verification === 'pending').length,
      totalMovies: movies.length,
      totalTheatres: theatres.length,
      revenue,
      ticketsSold: tickets,
      upcomingShows: upcoming.slice(0, 8),
      bookingsByDay: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      byCategory: (Object.keys(byCat) as RankCategory[]).map((category) => ({ category, tickets: byCat[category] })),
      busiestDay: busiest ? { date: busiest[0], bookings: busiest[1] } : null,
      popularMovie: popular ? { title: popular[0], bookings: popular[1] } : null,
    } satisfies DashboardStats;
  },

  async adminListBookings(filter = {}) {
    let q = sb().from('bookings').select(BOOKING_SELECT).not('status', 'in', '(held,expired)').order('created_at', { ascending: false }).limit(1000);
    if (filter.status && filter.status !== 'all') q = q.eq('status', filter.status);
    let rows = (await unwrap<Row[]>(q)).map(toDetails);
    if (filter.date) rows = rows.filter((b) => b.show.date === filter.date);
    if (filter.theatreId) rows = rows.filter((b) => b.theatre.id === filter.theatreId);
    const term = filter.query?.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (b) => b.code.toLowerCase().includes(term) || b.customerName.toLowerCase().includes(term) || b.mobile.includes(term) || b.movie.title.toLowerCase().includes(term),
      );
    }
    return rows;
  },

  async adminListUsers() {
    const [rows, admins] = await Promise.all([
      unwrap<Row[]>(sb().from('profiles').select('*').order('created_at', { ascending: false })),
      unwrap<Row[]>(sb().from('admin_users').select('user_id')),
    ]);
    const adminIds = new Set(admins.map((a) => a.user_id));
    return rows.map((r) => toProfile(r, adminIds.has(r.id)));
  },

  async adminSetVerification(userId, status) {
    const admin = await me();
    await unwrap(sb().from('profiles').update({ verification: status }).eq('id', userId));
    await unwrap(sb().from('army_verifications').insert({ user_id: userId, service_id: '', status, method: 'admin_review', decided_by: admin.id }));
  },

  async saveMovie(input, id) {
    const row = fromMovie({ ...input, slug: input.slug || slugify(input.title) });
    const r = id
      ? await unwrap<Row>(sb().from('movies').update(row).eq('id', id).select().single())
      : await unwrap<Row>(sb().from('movies').insert(row).select().single());
    return toMovie(r);
  },

  async deleteMovie(id) {
    await unwrap(sb().from('movies').delete().eq('id', id));
  },

  async uploadPoster(file) {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new AppError('VALIDATION', 'Please upload a JPG, PNG, WebP or AVIF image.');
    if (file.size > 8 * 1024 * 1024) throw new AppError('VALIDATION', 'Please upload an image under 8 MB.');
    const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    const { error } = await sb().storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) fail(error);
    return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  async saveTheatre(input, id) {
    const row = {
      slug: input.slug || slugify(input.name),
      name: input.name,
      location: input.location,
      city: input.city,
      description: input.description,
      facilities: input.facilities,
      layout_key: input.layoutKey,
      weekly_schedule: input.weeklySchedule,
      active: input.active,
    };
    const r = id
      ? await unwrap<Row>(sb().from('theatres').update(row).eq('id', id).select().single())
      : await unwrap<Row>(sb().from('theatres').insert(row).select().single());
    if (!id) {
      const screen = await unwrap<Row>(
        sb().from('screens').insert({ theatre_id: r.id, name: 'Main Hall', layout_key: input.layoutKey }).select().single(),
      );
      const seats = [...seatIndex(input.layoutKey).values()].map((s) => ({
        screen_id: screen.id,
        code: s.id,
        row_label: s.row,
        seat_number: s.number,
        category: s.category,
        seat_type: s.type,
        blocked_reason: s.blocked,
      }));
      await unwrap(sb().from('seats').insert(seats));
    }
    return toTheatre(r);
  },

  async deleteTheatre(id) {
    await unwrap(sb().from('theatres').delete().eq('id', id));
  },

  async listScreens() {
    return (await unwrap<Row[]>(sb().from('screens').select('*'))).map(
      (r): Screen => ({ id: r.id, theatreId: r.theatre_id, name: r.name, layoutKey: r.layout_key }),
    );
  },

  async saveShow(input, id) {
    const screen = await unwrap<Row | null>(sb().from('screens').select('id').eq('theatre_id', input.theatreId).limit(1).maybeSingle());
    if (!screen) throw new AppError('VALIDATION', 'This theatre has no screen yet.');
    const row = {
      movie_id: input.movieId,
      theatre_id: input.theatreId,
      screen_id: screen.id,
      show_date: input.date,
      show_time: input.time,
      price_offrs: input.prices.OFFRS,
      price_jcos: input.prices.JCOS,
      price_ors: input.prices.ORS,
      ...(input.status ? { status: input.status } : {}),
    };
    const r = id
      ? await unwrap<Row>(sb().from('shows').update(row).eq('id', id).select().single())
      : await unwrap<Row>(sb().from('shows').insert(row).select().single());
    return toShow(r);
  },

  async deleteShow(id) {
    const { error } = await sb().from('shows').delete().eq('id', id);
    if (!error) return 'deleted';
    await unwrap(sb().rpc('cancel_show', { p_show_id: id }));
    return 'cancelled';
  },

  async generateShows(theatreId, movieId, from, days, prices) {
    const theatre = toTheatre(await unwrap<Row>(sb().from('theatres').select('*').eq('id', theatreId).single()));
    let added = 0;
    for (let i = 0; i < Math.min(days, 28); i++) {
      const date = addDays(from, i);
      for (const time of theatre.weeklySchedule[parseDateKey(date).getDay()] ?? []) {
        if (isShowPast(date, time)) continue;
        try {
          await this.saveShow({ movieId, theatreId, date, time, prices });
          added++;
        } catch (e) {
          if (!(e instanceof AppError && e.code === 'CONFLICT')) throw e;
        }
      }
    }
    return added;
  },
};
