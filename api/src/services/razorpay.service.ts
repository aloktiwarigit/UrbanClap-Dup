import Razorpay from 'razorpay';
import { equalsHexHmac } from '../shared/timing-safe.js';

let _rzp: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_rzp) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
    _rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _rzp;
}

export async function createRazorpayOrder(opts: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const order = await getRazorpay().orders.create(opts);
  return { id: order.id, amount: order.amount, currency: order.currency };
}

export function verifyPaymentSignature(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Missing RAZORPAY_KEY_SECRET');
  return equalsHexHmac(
    secret,
    `${opts.razorpayOrderId}|${opts.razorpayPaymentId}`,
    opts.razorpaySignature,
  );
}

export async function createTransfer(opts: {
  accountId: string;
  amount: number;
  currency?: string;
  notes?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<{ transferId: string }> {
  const result = await (getRazorpay().transfers.create as (
    params: unknown,
    callOpts?: unknown,
  ) => Promise<{ id: string }>)(
    {
      account: opts.accountId,
      amount: opts.amount,
      currency: opts.currency ?? 'INR',
      on_hold: 0,
      ...(opts.notes && { notes: opts.notes }),
    },
    opts.idempotencyKey
      ? { headers: { 'X-Razorpay-Idempotency-Key': opts.idempotencyKey } }
      : undefined,
  );
  return { transferId: result.id };
}
