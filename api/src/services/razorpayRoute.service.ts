export interface RouteTransferInput {
  accountId: string;
  amount: number;
  notes: Record<string, string>;
  idempotencyKey: string;
}

export interface RouteTransferResult {
  transferId: string;
}

export class RazorpayRouteService {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor() {
    this.keyId = process.env['RAZORPAY_KEY_ID'] ?? '';
    this.keySecret = process.env['RAZORPAY_KEY_SECRET'] ?? '';
  }

  async transfer(input: RouteTransferInput): Promise<RouteTransferResult> {
    const credentials = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
        'X-Razorpay-Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        account: input.accountId,
        amount: input.amount,
        currency: 'INR',
        notes: input.notes,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Razorpay transfer failed: ${response.status} ${errorBody}`);
    }

    const data = (await response.json()) as { id: string };
    return { transferId: data.id };
  }
}
