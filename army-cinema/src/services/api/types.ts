import type {
  Booking,
  BookingDetails,
  BookingStatus,
  CategoryPrices,
  DashboardStats,
  Movie,
  PaymentMethod,
  Profile,
  RankCategory,
  Screen,
  Show,
  ShowWithRefs,
  Theatre,
  VerificationStatus,
} from '@/types';

export interface RegisterInput {
  fullName: string;
  serviceId: string;
  mobile: string;
  email: string;
  password: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  rankTitle?: string;
  rankCategory?: RankCategory;
  message: string;
}

export interface ShowFilter {
  movieId?: string;
  theatreId?: string;
  date?: string;
  from?: string;
  to?: string;
  includePast?: boolean;
}

export interface BookingFilter {
  date?: string;
  status?: BookingStatus | 'all';
  query?: string;
  theatreId?: string;
}

export type MovieInput = Omit<Movie, 'id' | 'createdAt' | 'slug'> & { slug?: string };
export type TheatreInput = Omit<Theatre, 'id' | 'createdAt' | 'slug'> & { slug?: string };
export interface ShowInput {
  movieId: string;
  theatreId: string;
  date: string;
  time: string;
  prices: CategoryPrices;
  status?: Show['status'];
}

export interface HoldInput {
  showId: string;
  seats: string[];
}

export interface PaymentConfirmation {
  method: PaymentMethod;
  reference: string | null;
  paid: boolean;
}

/**
 * Everything the UI needs from a backend. Two implementations exist:
 * `demoApi` (browser storage, seeded) and `supabaseApi` (PostgreSQL + RLS).
 */
export interface Api {
  readonly mode: 'demo' | 'supabase';

  // Auth & profile
  getCurrentUser(): Promise<Profile | null>;
  login(identifier: string, password: string): Promise<Profile>;
  requestOtp(identifier: string): Promise<{ channel: string; demoCode?: string }>;
  verifyOtp(identifier: string, code: string): Promise<Profile>;
  logout(): Promise<void>;
  checkServiceRecord(serviceId: string, fullName: string): Promise<VerificationResult>;
  register(input: RegisterInput): Promise<{ profile: Profile; verification: VerificationResult }>;
  requestPasswordReset(identifier: string): Promise<{ demoCode?: string }>;
  resetPassword(identifier: string, code: string, newPassword: string): Promise<void>;
  updateProfile(patch: Partial<Pick<Profile, 'fullName' | 'email' | 'unit'>>): Promise<Profile>;

  // Catalogue
  listMovies(): Promise<Movie[]>;
  getMovieBySlug(slug: string): Promise<Movie | null>;
  listTheatres(): Promise<Theatre[]>;
  getTheatreBySlug(slug: string): Promise<Theatre | null>;
  listShows(filter?: ShowFilter): Promise<ShowWithRefs[]>;
  getShow(id: string): Promise<ShowWithRefs | null>;
  getOccupiedSeats(showId: string): Promise<string[]>;

  // Booking
  holdSeats(input: HoldInput): Promise<Booking>;
  confirmBooking(bookingId: string, payment: PaymentConfirmation): Promise<BookingDetails>;
  releaseHold(bookingId: string, reason?: 'payment_failed' | 'cancelled'): Promise<void>;
  getBooking(id: string): Promise<BookingDetails | null>;
  listMyBookings(): Promise<BookingDetails[]>;
  cancelBooking(id: string): Promise<void>;
  weeklyBookingFor(date: string): Promise<BookingDetails | null>;

  // Admin
  adminStats(): Promise<DashboardStats>;
  adminListBookings(filter?: BookingFilter): Promise<BookingDetails[]>;
  adminListUsers(): Promise<Profile[]>;
  adminSetVerification(userId: string, status: VerificationStatus): Promise<void>;
  saveMovie(input: MovieInput, id?: string): Promise<Movie>;
  deleteMovie(id: string): Promise<void>;
  uploadPoster(file: File): Promise<string>;
  saveTheatre(input: TheatreInput, id?: string): Promise<Theatre>;
  deleteTheatre(id: string): Promise<void>;
  listScreens(): Promise<Screen[]>;
  saveShow(input: ShowInput, id?: string): Promise<Show>;
  /** Deletes a show without bookings, or cancels it (and its bookings) when it has some. */
  deleteShow(id: string): Promise<'deleted' | 'cancelled'>;
  /** Creates shows for a theatre from its weekly schedule. Returns how many were added. */
  generateShows(theatreId: string, movieId: string, from: string, days: number, prices: CategoryPrices): Promise<number>;
}
