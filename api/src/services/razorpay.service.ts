import Razorpay from 'razorpay';
import { createHmac } from 'node:crypto';

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

export async function createRazorpayOrder(opts: { amount: number; currency: string; receipt: string }) {
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
  const expected = createHmac('sha256', secret)
    .update(`${opts.razorpayOrderId}|${opts.razorpayPaymentId}`)
    .digest('hex');
  return expected === opts.razorpaySignature;
}
