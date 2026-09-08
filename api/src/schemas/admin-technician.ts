import { z } from 'zod';
import { CommissionHoldSchema } from './technician.js';

export const AdminTechnicianStatusSchema = z.enum(['ON_DUTY', 'OFF_DUTY', 'SUSPENDED']);
export const AdminKycStatusSchema = z.enum(['VERIFIED', 'PENDING', 'REJECTED']);

export const AdminTechnicianSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  status: AdminTechnicianStatusSchema,
  kycStatus: AdminKycStatusSchema,
  kycDocumentUrl: z.string().optional(),
  serviceCategories: z.array(z.string()),
  commissionPct: z.number().int().min(0).max(100),
  activeBookingCount: z.number().int().min(0),
  lastActiveAt: z.string().optional(),
  // Additive (task 10, E21-S03). Projects the same cached hold the finance dashboard reads
  // (`TechnicianProfileSchema.commissionHold`, api/src/schemas/technician.ts) so the roster can
  // show a technician's hold state without a second, page-scoped fetch. Optional and left that
  // way deliberately: a technician who has never had a hold computed genuinely has none yet —
  // that must never be conflated with a computed CLEAR state.
  commissionHold: CommissionHoldSchema.optional(),
});

export const AdminTechnicianListResponseSchema = z.object({
  technicians: z.array(AdminTechnicianSchema),
});

export type AdminTechnician = z.infer<typeof AdminTechnicianSchema>;
export type AdminTechnicianListResponse = z.infer<typeof AdminTechnicianListResponseSchema>;
