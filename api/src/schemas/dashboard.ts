import { z } from 'zod';

// BookingEventSchema — individual event in the live feed
export const BookingEventSchema = z
  .object({
    id: z.string(),
    bookingId: z.string(),
    status: z.string(),
    customerId: z.string(),
    technicianId: z.string().optional(),
    serviceId: z.string(),
    amount: z.number().int().nonnegative(), // paise
    createdAt: z.string(), // ISO string
    kind: z.enum(['booking', 'assigned', 'completed', 'alert', 'payout', 'complaint']),
    title: z.string(),
    detail: z.string().optional(),
  })
  .openapi('BookingEvent');

// DashboardSummarySchema — today's 6 KPI counters
export const DashboardSummarySchema = z
  .object({
    bookingsToday: z.number().int().nonnegative(),
    gmvToday: z.number().int().nonnegative(), // paise
    commissionToday: z.number().int().nonnegative(), // paise
    payoutsPending: z.number().int().nonnegative(), // paise
    complaintsOpen: z.number().int().nonnegative(),
    techsOnDuty: z.number().int().nonnegative(),
  })
  .strict()
  .openapi('DashboardSummary');

// TechLocationSchema — one active tech pin on the map
export const TechLocationSchema = z
  .object({
    technicianId: z.string(),
    name: z.string().optional(),
    serviceType: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    state: z.enum(['active', 'enroute', 'idle', 'alert']),
    updatedAt: z.string(), // ISO string
  })
  .openapi('TechLocation');

// Response wrappers
export const DashboardSummaryResponseSchema = z
  .object({
    summary: DashboardSummarySchema,
  })
  .openapi('DashboardSummaryResponse');

export const BookingEventsResponseSchema = z
  .object({
    events: z.array(BookingEventSchema),
    total: z.number().int().nonnegative(),
  })
  .openapi('BookingEventsResponse');

export const TechLocationsResponseSchema = z
  .object({
    techs: z.array(TechLocationSchema),
  })
  .openapi('TechLocationsResponse');

// Inferred types
export type BookingEvent = z.infer<typeof BookingEventSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type TechLocation = z.infer<typeof TechLocationSchema>;
export type DashboardSummaryResponse = z.infer<typeof DashboardSummaryResponseSchema>;
export type BookingEventsResponse = z.infer<typeof BookingEventsResponseSchema>;
export type TechLocationsResponse = z.infer<typeof TechLocationsResponseSchema>;
