export type RankCategory = 'OFFRS' | 'JCOS' | 'ORS';
export type Role = 'user' | 'admin';
export type VerificationStatus = 'verified' | 'pending' | 'rejected';
export type MovieStatus = 'now_showing' | 'upcoming' | 'archived';
export type LayoutKey = 'kerketta' | 'compact' | 'standard';

export interface Movie {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description: string;
  genres: string[];
  language: string;
  durationMin: number;
  /** Censor certificate, e.g. "UA 13+" */
  certification: string;
  /** Audience score out of 10 (optional, admin-entered) */
  score?: number | null;
  releaseDate: string; // YYYY-MM-DD
  director: string;
  cast: string[];
  posterUrl?: string | null;
  trailerUrl?: string | null;
  status: MovieStatus;
  featured: boolean;
  /** Two colours used by the generated placeholder poster */
  palette: [string, string];
  createdAt: string;
}

export type WeeklySchedule = Record<number, string[]>; // 0 = Sunday … 6 = Saturday

export interface Theatre {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  description: string;
  facilities: string[];
  layoutKey: LayoutKey;
  weeklySchedule: WeeklySchedule;
  active: boolean;
  createdAt: string;
}

export interface Screen {
  id: string;
  theatreId: string;
  name: string;
  layoutKey: LayoutKey;
}

export type CategoryPrices = Record<RankCategory, number>;

export interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  prices: CategoryPrices;
  status: 'scheduled' | 'cancelled';
  createdAt: string;
}

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired' | 'payment_failed';
export type PaymentMethod = 'counter' | 'upi' | 'card';
export type PaymentStatus = 'unpaid' | 'paid' | 'pay_at_counter' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  /** Human-readable reference, e.g. ARM-2026-000123. The only value put in the QR code. */
  code: string;
  userId: string | null;
  showId: string;
  category: RankCategory;
  seats: string[]; // seat ids, e.g. "ORS-A12"
  unitPrice: number;
  subtotal: number;
  fee: number;
  total: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  /** Mobile the booking counts against for the one-booking-per-week rule */
  mobile: string;
  /** Friday that starts the Fri–Thu week of the show */
  weekStart: string;
  source: 'online' | 'counter';
  guestName?: string | null;
  holdExpiresAt: string | null;
  createdAt: string;
  cancelledAt?: string | null;
}

export interface Profile {
  id: string;
  fullName: string;
  rankTitle: string;
  serviceId: string;
  rankCategory: RankCategory;
  unit?: string;
  mobile: string;
  email: string;
  role: Role;
  verification: VerificationStatus;
  createdAt: string;
}

/** A booking joined with everything needed to display it. */
export interface BookingDetails extends Booking {
  show: Show;
  movie: Movie;
  theatre: Theatre;
  customerName: string;
}

export interface ShowWithRefs extends Show {
  movie: Movie;
  theatre: Theatre;
  seatsTotal: number;
  seatsAvailable: number;
}

export interface Session {
  userId: string;
  expiresAt: number;
}

export interface DashboardStats {
  totalBookings: number;
  todaysBookings: number;
  totalUsers: number;
  pendingVerifications: number;
  totalMovies: number;
  totalTheatres: number;
  revenue: number;
  ticketsSold: number;
  upcomingShows: ShowWithRefs[];
  bookingsByDay: { date: string; bookings: number; revenue: number }[];
  byCategory: { category: RankCategory; tickets: number }[];
  busiestDay: { date: string; bookings: number } | null;
  popularMovie: { title: string; bookings: number } | null;
}
