import type { PaymentMethod } from '@/types';

export interface PaymentRequest {
  bookingId: string;
  bookingLabel: string;
  amount: number; // INR
  method: PaymentMethod;
  /** Method-specific details collected by the checkout form (never persisted). */
  details: { upiId?: string; cardNumber?: string; cardExpiry?: string; cardCvv?: string };
}

export interface PaymentResult {
  status: 'success' | 'failed' | 'deferred';
  reference: string | null;
  message?: string;
}

/**
 * A payment gateway. Swap `SimulatedGateway` for a real implementation
 * (Razorpay, PayU, CCAvenue…) that creates the order on your server and
 * verifies the signature server-side before calling `confirmBooking`.
 */
export interface PaymentGateway {
  readonly name: string;
  readonly simulated: boolean;
  pay(req: PaymentRequest): Promise<PaymentResult>;
}
