export type ErrorCode =
  | 'AUTH_INVALID'
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'NOT_VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'ALREADY_REGISTERED'
  | 'SEAT_TAKEN'
  | 'WEEKLY_LIMIT'
  | 'MAX_SEATS'
  | 'CATEGORY_NOT_ALLOWED'
  | 'SHOW_UNAVAILABLE'
  | 'HOLD_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'OTP_INVALID'
  | 'NETWORK'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UNKNOWN';

const FRIENDLY: Record<ErrorCode, string> = {
  AUTH_INVALID: 'Those login details don’t match our records. Please check and try again.',
  AUTH_REQUIRED: 'Please log in to continue.',
  SESSION_EXPIRED: 'Your session has expired for your security. Please log in again.',
  NOT_VERIFIED: 'Your service verification is still pending. You can book once it is approved.',
  VERIFICATION_FAILED: 'We couldn’t verify these service details. Check your Service ID and name exactly as in your records.',
  ALREADY_REGISTERED: 'An account already exists with these details. Try logging in instead.',
  SEAT_TAKEN: 'Sorry — one or more of your seats were just booked by someone else. Please pick again.',
  WEEKLY_LIMIT: 'This mobile number already has a booking this week. Only one booking per number is allowed each week (Fri–Thu).',
  MAX_SEATS: 'You can book a maximum of 4 seats in one booking.',
  CATEGORY_NOT_ALLOWED: 'These seats are reserved for a different category.',
  SHOW_UNAVAILABLE: 'This show is no longer available for booking.',
  HOLD_EXPIRED: 'Your seat hold has expired. Please select your seats again.',
  PAYMENT_FAILED: 'The payment didn’t go through and you have not been charged. Please try again or choose another method.',
  OTP_INVALID: 'That code is incorrect or has expired.',
  NETWORK: 'We can’t reach the server. Check your internet connection and try again.',
  NOT_FOUND: 'We couldn’t find what you were looking for.',
  FORBIDDEN: 'You don’t have permission to do that.',
  VALIDATION: 'Please check the highlighted fields.',
  CONFLICT: 'This item is in use and can’t be changed right now.',
  UNKNOWN: 'Something went wrong on our side. Please try again.',
};

export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? FRIENDLY[code]);
    this.code = code;
    this.details = details;
  }
}

/** Converts anything thrown into a friendly, user-safe message. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return new AppError('NETWORK');
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) return new AppError('NETWORK');
  if (import.meta.env.DEV) console.error(err);
  return new AppError('UNKNOWN');
}

export function friendlyMessage(err: unknown): string {
  return toAppError(err).message;
}
