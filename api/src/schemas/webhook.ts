import { z } from 'zod';

/**
 * Razorpay webhook payload schema.
 *
 * Full shape:
 * {
 *   entity: "event",
 *   account_id: string,
 *   event: string,           // e.g. "payment.captured"
 *   contains: string[],
 *   payload: {
 *     payment: {
 *       entity: {
 *         id: string,         // paymentId
 *         order_id: string,   // maps to booking.paymentOrderId
 *         amount: number,
 *         currency: string,
 *         status: string,
 *         ...                 // additional fields passed through
 *       }
 *     }
 *   }
 * }
 */
export const RazorpayWebhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z
        .object({
          id: z.string(),
          order_id: z.string(),
        })
        .passthrough(),
    }),
  }),
}).passthrough();

export type RazorpayWebhookPayload = z.infer<typeof RazorpayWebhookPayloadSchema>;
