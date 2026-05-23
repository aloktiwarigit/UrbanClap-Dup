import { z } from 'zod';

export const AdminCustomerStatusSchema = z.enum(['ACTIVE', 'FLAGGED']);

export const RecentBookingSchema = z.object({
  date: z.string(),
  service: z.string(),
  techName: z.string(),
  status: z.string(),
});

export const RecentComplaintSchema = z.object({
  date: z.string(),
  category: z.string(),
  resolution: z.string(),
});

export const CustomerNoteSchema = z.object({
  text: z.string(),
  createdAt: z.string(),
  authorName: z.string(),
});

export const AdminCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  city: z.string(),
  bookingCount: z.number().int().min(0),
  lastBookingDate: z.string().optional(),
  accountStatus: AdminCustomerStatusSchema,
  openComplaintCount: z.number().int().min(0),
  recentBookings: z.array(RecentBookingSchema),
  recentComplaints: z.array(RecentComplaintSchema),
  notes: z.array(CustomerNoteSchema),
});

export const AdminCustomerListResponseSchema = z.object({
  customers: z.array(AdminCustomerSchema),
});

export const PatchCustomerBodySchema = z.object({
  accountStatus: AdminCustomerStatusSchema,
});

export const AddCustomerNoteBodySchema = z.object({
  text: z.string().min(1).max(500),
});

export const RefundCreditBodySchema = z.object({
  amountRupees: z.number().int().positive().max(10000),
  reason: z.string().min(1).max(200),
});

export type AdminCustomer = z.infer<typeof AdminCustomerSchema>;
export type AdminCustomerListResponse = z.infer<typeof AdminCustomerListResponseSchema>;
