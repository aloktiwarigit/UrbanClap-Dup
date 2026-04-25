import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ComplaintTypeEnum = z.enum(['RATING_SHIELD', 'STANDARD']);

export const ComplaintStatusEnum = z.enum(['NEW', 'INVESTIGATING', 'RESOLVED']);

export const ComplaintResolutionCategoryEnum = z.enum([
  'TECHNICIAN_MISCONDUCT',
  'SERVICE_QUALITY',
  'BILLING_DISPUTE',
  'LATE_ARRIVAL',
  'NO_SHOW',
  'OTHER',
]);

export const InternalNoteSchema = z.object({
  adminId: z.string(),
  note: z.string(),
  createdAt: z.string(),
}).openapi('InternalNote');

export const ComplaintDocSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  customerId: z.string(),
  technicianId: z.string(),
  description: z.string(),
  type: ComplaintTypeEnum.default('STANDARD'),
  draftOverall: z.number().int().min(1).max(5).optional(),
  draftComment: z.string().max(500).optional(),
  expiresAt: z.string().optional(),
  status: ComplaintStatusEnum,
  assigneeAdminId: z.string().optional(),
  resolutionCategory: ComplaintResolutionCategoryEnum.optional(),
  internalNotes: z.array(InternalNoteSchema).default([]),
  slaDeadlineAt: z.string(),
  escalated: z.boolean().default(false),
  resolvedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateComplaintBodySchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  technicianId: z.string(),
  description: z.string().min(10).max(2000),
}).openapi('CreateComplaintBody');

export const PatchComplaintBodySchema = z.object({
  status: ComplaintStatusEnum.optional(),
  // Client sends the status it observed before dispatching; server rejects if it has changed.
  expectedStatus: ComplaintStatusEnum.optional(),
  // null = clear the assignee; undefined = leave unchanged; string = set to value
  assigneeAdminId: z.string().nullable().optional(),
  resolutionCategory: ComplaintResolutionCategoryEnum.optional(),
  note: z.string().min(1).max(2000).optional(),
}).openapi('PatchComplaintBody');

export const EscalateRatingBodySchema = z.object({
  draftOverall: z.number().int().min(1).max(2),
  draftComment: z.string().max(500).optional(),
}).openapi('EscalateRatingBody');

export const EscalateRatingResponseSchema = z.object({
  complaintId: z.string(),
  expiresAt: z.string(),
}).openapi('EscalateRatingResponse');

export const ComplaintListQuerySchema = z.object({
  status: z.string().optional().transform(s =>
    s ? s.split(',').map(x => x.trim()).filter(Boolean) : undefined
  ).pipe(z.array(ComplaintStatusEnum).optional()),
  assigneeAdminId: z.string().optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  resolvedSince: z.string().datetime({ offset: true }).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(50).transform(v => Math.min(v, 200)),
});

export const ComplaintListResponseSchema = z.object({
  items: z.array(ComplaintDocSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
}).openapi('ComplaintListResponse');

export const RepeatOffenderSchema = z.object({
  technicianId: z.string(),
  count: z.number(),
}).openapi('RepeatOffender');

export const RepeatOffendersResponseSchema = z.object({
  offenders: z.array(RepeatOffenderSchema),
}).openapi('RepeatOffendersResponse');

export type ComplaintType = z.infer<typeof ComplaintTypeEnum>;
export type EscalateRatingBody = z.infer<typeof EscalateRatingBodySchema>;
export type EscalateRatingResponse = z.infer<typeof EscalateRatingResponseSchema>;
export type ComplaintStatus = z.infer<typeof ComplaintStatusEnum>;
export type ComplaintResolutionCategory = z.infer<typeof ComplaintResolutionCategoryEnum>;
export type InternalNote = z.infer<typeof InternalNoteSchema>;
export type ComplaintDoc = z.infer<typeof ComplaintDocSchema>;
export type CreateComplaintBody = z.infer<typeof CreateComplaintBodySchema>;
export type PatchComplaintBody = z.infer<typeof PatchComplaintBodySchema>;
export type ComplaintListQuery = z.infer<typeof ComplaintListQuerySchema>;
export type ComplaintListResponse = z.infer<typeof ComplaintListResponseSchema>;
export type RepeatOffender = z.infer<typeof RepeatOffenderSchema>;
export type RepeatOffendersResponse = z.infer<typeof RepeatOffendersResponseSchema>;
