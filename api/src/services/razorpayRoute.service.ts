import Razorpay from 'razorpay';

export interface RazorpayTransferInput {
  accountId: string;
  amount: number;
  notes: Record<string, string>;
}

export interface RazorpayTransferResult {
  transferId: string;
}

export interface IRazorpayRouteService {
  transfer(input: RazorpayTransferInput): Promise<RazorpayTransferResult>;
}

export class RazorpayRouteService implements IRazorpayRouteService {
  private readonly client: Razorpay;

  constructor() {
    const keyId = process.env['RAZORPAY_KEY_ID'];
    const keySecret = process.env['RAZORPAY_KEY_SECRET'];
    if (!keyId) throw new Error('Missing env var: RAZORPAY_KEY_ID');
    if (!keySecret) throw new Error('Missing env var: RAZORPAY_KEY_SECRET');
    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async transfer(input: RazorpayTransferInput): Promise<RazorpayTransferResult> {
    const result = await (this.client.transfers.create as (params: unknown) => Promise<{ id: string }>)({
      account: input.accountId,
      amount: input.amount,
      currency: 'INR',
      on_hold: 0,
      notes: input.notes,
    });
    return { transferId: result.id };
  }
}
