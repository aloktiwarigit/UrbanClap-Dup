import { z } from 'zod';

export const PostLocationRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(1000),
  capturedAt: z.number().int(),
  attestation: z.object({
    isMock: z.boolean(),
    gpsAccuracyM: z.number(),
  }).optional(),
});

export type PostLocationRequest = z.infer<typeof PostLocationRequestSchema>;

export interface LiveLocationDoc {
  id: string;          // = bookingId (single doc per active booking, last-write-wins)
  bookingId: string;
  technicianId: string;
  customerId: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  capturedAt: number;
  isMock: boolean;
  receivedAt: string;  // ISO
  ttl: number;         // 3600 (Cosmos auto-deletes after 1h)
}
