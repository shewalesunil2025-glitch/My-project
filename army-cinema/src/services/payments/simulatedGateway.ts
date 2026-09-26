import type { PaymentGateway, PaymentRequest, PaymentResult } from './types';

/**
 * Prototype gateway. No money moves and no card data leaves the browser.
 * Test values that simulate a decline:
 *   UPI ID  fail@upi
 *   Card    4000 0000 0000 0002
 */
export const simulatedGateway: PaymentGateway = {
  name: 'Simulated gateway',
  simulated: true,
  async pay(req: PaymentRequest): Promise<PaymentResult> {
    if (req.method === 'counter') return { status: 'deferred', reference: null };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { status: 'failed', reference: null, message: 'You appear to be offline.' };
    }
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));
    const card = req.details.cardNumber?.replace(/\s/g, '') ?? '';
    const declined = req.details.upiId?.trim().toLowerCase() === 'fail@upi' || card === '4000000000000002';
    if (declined) return { status: 'failed', reference: null, message: 'The bank declined this payment.' };
    const ref = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`;
    return { status: 'success', reference: ref };
  },
};
