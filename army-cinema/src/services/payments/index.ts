import { simulatedGateway } from './simulatedGateway';
import type { PaymentGateway } from './types';

export type { PaymentGateway, PaymentRequest, PaymentResult } from './types';

/** The active gateway. Replace with a real one once server-side verification exists. */
export const paymentGateway: PaymentGateway = simulatedGateway;

/** Booking fee per booking by method (INR). Waived for service personnel in this prototype. */
export const BOOKING_FEE = { counter: 0, upi: 0, card: 0 } as const;
