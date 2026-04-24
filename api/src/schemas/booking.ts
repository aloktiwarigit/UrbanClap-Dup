import { z } from 'zod';

export const BookingDocSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  serviceId: z.string(),
  categoryId: z.string(),
  slotDate: z.string(),
  slotWindow: z.string(),
  addressText: z.string(),
  addressLatLng: z.object({ lat: z.number(), lng: z.number() }),
  status: z.string(),
  paymentOrderId: z.string().optional(),
  paymentId: z.string().optional(),
  paymentSignature: z.string().optional(),
  amount: z.number().int().nonnegative(),
  finalAmount: z.number().int().nonnegative().optional(),
  technicianId: z.string().optional(),
  createdAt: z.string(),
});

export type BookingDoc = z.infer<typeof BookingDocSchema>;
