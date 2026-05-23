import { z } from 'zod';

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
});

export const AdminTechnicianListResponseSchema = z.object({
  technicians: z.array(AdminTechnicianSchema),
});

export type AdminTechnician = z.infer<typeof AdminTechnicianSchema>;
export type AdminTechnicianListResponse = z.infer<typeof AdminTechnicianListResponseSchema>;
