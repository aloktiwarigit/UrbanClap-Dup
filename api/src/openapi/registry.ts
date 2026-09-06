import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { HealthResponseSchema } from '../schemas/health.js';
import {
  DashboardSummarySchema,
  DashboardSummaryResponseSchema,
  BookingEventSchema,
  BookingEventsResponseSchema,
  TechLocationSchema,
  TechLocationsResponseSchema,
} from '../schemas/dashboard.js';
import {
  ServiceCategorySchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
} from '../schemas/service-category.js';
import {
  ServiceDetailSchema,
  ServiceCardSchema,
  CreateServiceBodySchema,
  UpdateServiceBodySchema,
  ServiceSchema,
} from '../schemas/service.js';
import {
  ComplaintDocSchema,
  CreateComplaintBodySchema,
  PatchComplaintBodySchema,
  ComplaintListResponseSchema,
  RepeatOffendersResponseSchema,
} from '../schemas/complaint.js';
import {
  AdminErasurePatchBodySchema,
  ErasureRequestDocSchema,
} from '../schemas/erasure-request.js';
import {
  SscLevyDocSchema,
  SscLevyStatusSchema,
} from '../schemas/ssc-levy.js';
import { TechnicianCandidateListResponseSchema } from '../schemas/order.js';
import {
  UpdateCommissionConfigBodySchema,
  EffectiveCommissionConfigSchema,
} from '../schemas/commission-config.js';
import {
  CommissionReceivableEntrySchema,
  MarkCommissionReceivedBodySchema,
  TechnicianCommissionDueV2Schema,
} from '../schemas/commission-receivable.js';
import {
  RemittanceDocSchema,
  CreditDocSchema,
  RecordRemittanceBodySchema,
} from '../schemas/commission-ledger.js';
import { CommissionHoldSchema, HoldStateSchema } from '../schemas/technician.js';
import { TechnicianConfigResponseSchema } from '../schemas/technician-client-config.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Auth ──────────────────────────────────────────────────────────────────────

const TruecallerVerifyRequestSchema = z.object({
  payload: z.string().min(1).openapi({ example: 'base64encodedPayload==' }),
  signature: z.string().min(1).openapi({ example: 'base64encodedSignature==' }),
  signatureAlgorithm: z.string().min(1).openapi({ example: 'SHA512withRSA' }),
  fcmToken: z.string().optional().openapi({ example: 'fcm-token-abc123' }),
}).openapi('TruecallerVerifyRequest');

const TruecallerVerifyResponseSchema = z.object({
  firebaseCustomToken: z.string().openapi({ example: 'eyJhbGci...' }),
  sessionExpiresAt: z.number().openapi({ example: 1700000000000 }),
}).openapi('TruecallerVerifyResponse');

registry.register('TruecallerVerifyRequest', TruecallerVerifyRequestSchema);
registry.register('TruecallerVerifyResponse', TruecallerVerifyResponseSchema);

registry.registerPath({
  method: 'post',
  path: '/v1/auth/truecaller/verify',
  operationId: 'verifyTruecaller',
  tags: ['auth'],
  summary: 'Verify Truecaller profile signature and mint Firebase custom token',
  description:
    'Verifies the Truecaller SDK RSA payload/signature against the Truecaller public key API ' +
    '(cached 24h in Cosmos). On success, mints a Firebase custom token for the verified phone number. ' +
    'Called by customer-app when truecaller_server_verify_v2 flag is ON.',
  request: {
    body: {
      content: { 'application/json': { schema: TruecallerVerifyRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Signature valid — Firebase custom token issued',
      content: { 'application/json': { schema: TruecallerVerifyResponseSchema } },
    },
    400: {
      description: 'Validation error or invalid signature',
    },
  },
});

const HealthResponse = HealthResponseSchema.openapi('HealthResponse');
registry.register('HealthResponse', HealthResponse);

registry.registerPath({
  method: 'get',
  path: '/v1/health',
  operationId: 'getHealth',
  tags: ['system'],
  summary: 'Liveness probe',
  description:
    'Returns api/ liveness status plus build metadata. Unauthenticated. Never touches the database.',
  responses: {
    200: {
      description: 'Service is live',
      content: {
        'application/json': { schema: HealthResponse },
      },
    },
  },
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

// Dashboard schemas
registry.register('DashboardSummary', DashboardSummarySchema);
registry.register('DashboardSummaryResponse', DashboardSummaryResponseSchema);
registry.register('BookingEvent', BookingEventSchema);
registry.register('BookingEventsResponse', BookingEventsResponseSchema);
registry.register('TechLocation', TechLocationSchema);
registry.register('TechLocationsResponse', TechLocationsResponseSchema);

registry.registerPath({
  method: 'get',
  path: '/v1/admin/dashboard/summary',
  operationId: 'adminGetDashboardSummary',
  tags: ['dashboard'],
  security: [{ cookieAuth: [] }],
  summary: "Today's live operations KPI counters",
  responses: {
    200: { description: 'Dashboard summary', content: { 'application/json': { schema: DashboardSummaryResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    502: { description: 'Upstream Cosmos error' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/admin/dashboard/feed',
  operationId: 'adminGetDashboardFeed',
  tags: ['dashboard'],
  security: [{ cookieAuth: [] }],
  summary: 'Recent 50 booking events, newest first',
  responses: {
    200: { description: 'Booking events feed', content: { 'application/json': { schema: BookingEventsResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    502: { description: 'Upstream Cosmos error' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/admin/dashboard/tech-locations',
  operationId: 'adminGetTechLocations',
  tags: ['dashboard'],
  security: [{ cookieAuth: [] }],
  summary: 'Active technician map pin positions',
  responses: {
    200: { description: 'Tech locations', content: { 'application/json': { schema: TechLocationsResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    502: { description: 'Upstream Cosmos error' },
  },
});

// ── Public catalogue ──────────────────────────────────────────────────────────

const ServiceCardResponse = ServiceCardSchema.openapi('ServiceCard');
const ServiceDetailResponse = ServiceDetailSchema.openapi('ServiceDetail');
const CategoryWithServicesSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameHi: z.string().min(1).max(100).optional().openapi({ example: 'एसी मरम्मत' }),
  heroImageUrl: z.string(),
  sortOrder: z.number(),
  services: z.array(ServiceCardResponse),
}).openapi('CategoryWithServices');

registry.register('ServiceCard', ServiceCardResponse);
registry.register('ServiceDetail', ServiceDetailResponse);
registry.register('CategoryWithServices', CategoryWithServicesSchema);

registry.registerPath({
  method: 'get', path: '/v1/categories', operationId: 'getCategories',
  tags: ['catalogue'], summary: 'List active categories with nested services (home screen)',
  responses: {
    200: { description: 'Active categories with card-shape services', content: { 'application/json': { schema: z.object({ categories: z.array(CategoryWithServicesSchema) }) } } },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/services/{id}', operationId: 'getServiceById',
  tags: ['catalogue'], summary: 'Full service detail',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Service detail', content: { 'application/json': { schema: ServiceDetailResponse } } },
    404: { description: 'Service not found' },
  },
});

// ── Admin catalogue ───────────────────────────────────────────────────────────

const AdminServiceCategory = ServiceCategorySchema.openapi('AdminServiceCategory');
const AdminService = ServiceSchema.openapi('AdminService');
registry.register('AdminServiceCategory', AdminServiceCategory);
registry.register('AdminService', AdminService);

registry.registerPath({
  method: 'get', path: '/v1/admin/catalogue/categories', operationId: 'adminListCategories',
  tags: ['admin-catalogue'], summary: 'List service categories (admin, includes inactive)',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Categories list', content: { 'application/json': { schema: z.object({ categories: z.array(AdminServiceCategory) }) } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/catalogue/categories/{id}', operationId: 'adminGetCategory',
  tags: ['admin-catalogue'], summary: 'Get a service category',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Category', content: { 'application/json': { schema: AdminServiceCategory } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/catalogue/categories', operationId: 'adminCreateCategory',
  tags: ['admin-catalogue'], summary: 'Create a service category',
  request: { body: { content: { 'application/json': { schema: CreateCategoryBodySchema } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: AdminServiceCategory } } }, 400: { description: 'Validation error' }, 409: { description: 'Duplicate id' } },
});

registry.registerPath({
  method: 'put', path: '/v1/admin/catalogue/categories/{id}', operationId: 'adminUpdateCategory',
  tags: ['admin-catalogue'], summary: 'Update a service category',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: UpdateCategoryBodySchema } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: AdminServiceCategory } } }, 404: { description: 'Not found' } },
});

registry.registerPath({
  method: 'patch', path: '/v1/admin/catalogue/categories/{id}/toggle', operationId: 'adminToggleCategory',
  tags: ['admin-catalogue'], summary: 'Toggle category active state',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: { 200: { description: 'Toggled', content: { 'application/json': { schema: AdminServiceCategory } } }, 404: { description: 'Not found' } },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/catalogue/services', operationId: 'adminListServices',
  tags: ['admin-catalogue'], summary: 'List services (admin, includes inactive)',
  parameters: [{ name: 'categoryId', in: 'query', required: false, schema: { type: 'string' } }],
  responses: { 200: { description: 'Services list', content: { 'application/json': { schema: z.object({ services: z.array(AdminService) }) } } } },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/catalogue/services/{id}', operationId: 'adminGetService',
  tags: ['admin-catalogue'], summary: 'Get a service',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Service', content: { 'application/json': { schema: AdminService } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/catalogue/services', operationId: 'adminCreateService',
  tags: ['admin-catalogue'], summary: 'Create a service',
  request: { body: { content: { 'application/json': { schema: CreateServiceBodySchema } } } },
  responses: { 201: { description: 'Created', content: { 'application/json': { schema: AdminService } } }, 400: { description: 'Validation error' }, 409: { description: 'Duplicate id' } },
});

registry.registerPath({
  method: 'put', path: '/v1/admin/catalogue/services/{id}', operationId: 'adminUpdateService',
  tags: ['admin-catalogue'], summary: 'Update a service',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: UpdateServiceBodySchema } } } },
  responses: { 200: { description: 'Updated', content: { 'application/json': { schema: AdminService } } }, 404: { description: 'Not found' } },
});

registry.registerPath({
  method: 'patch', path: '/v1/admin/catalogue/services/{id}/toggle', operationId: 'adminToggleService',
  tags: ['admin-catalogue'], summary: 'Toggle service active state',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: { 200: { description: 'Toggled', content: { 'application/json': { schema: AdminService } } }, 404: { description: 'Not found' } },
});

registry.registerPath({
  method: 'get',
  path: '/v1/admin/orders/{id}/technician-candidates',
  operationId: 'adminGetOrderTechnicianCandidates',
  tags: ['orders'],
  security: [{ cookieAuth: [] }],
  summary: 'Eligible technicians near an order address',
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Technician candidates', content: { 'application/json': { schema: TechnicianCandidateListResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Order not found' },
  },
});

// ── Complaints ─────────────────────────────────────────────────────────────────

const AdminComplaintDoc = ComplaintDocSchema.openapi('AdminComplaintDoc');
registry.register('AdminComplaintDoc', AdminComplaintDoc);
registry.register('CreateComplaintBody', CreateComplaintBodySchema);
registry.register('PatchComplaintBody', PatchComplaintBodySchema);
registry.register('ComplaintListResponse', ComplaintListResponseSchema);
registry.register('RepeatOffendersResponse', RepeatOffendersResponseSchema);

registry.registerPath({
  method: 'get', path: '/v1/admin/complaints', operationId: 'adminListComplaints',
  tags: ['complaints'], summary: 'List complaints with optional filters',
  security: [{ cookieAuth: [] }],
  parameters: [
    { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'assigneeAdminId', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'dateFrom', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'dateTo', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'resolvedSince', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'sortDir', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } },
    { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
    { name: 'pageSize', in: 'query', required: false, schema: { type: 'integer', default: 50 } },
  ],
  responses: {
    200: { description: 'Paginated complaints list', content: { 'application/json': { schema: ComplaintListResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/complaints', operationId: 'adminCreateComplaint',
  tags: ['complaints'], summary: 'File a new complaint',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateComplaintBodySchema } } } },
  responses: {
    201: { description: 'Complaint created', content: { 'application/json': { schema: AdminComplaintDoc } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'patch', path: '/v1/admin/complaints/{id}', operationId: 'adminPatchComplaint',
  tags: ['complaints'], summary: 'Update complaint status, assignee, resolution, or add a note',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: PatchComplaintBodySchema } } } },
  responses: {
    200: { description: 'Updated complaint', content: { 'application/json': { schema: AdminComplaintDoc } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Complaint not found' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/complaints/repeat-offenders', operationId: 'adminGetRepeatOffenders',
  tags: ['complaints'], summary: 'Technicians with 3+ resolved complaints in the rolling window',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Repeat offenders list', content: { 'application/json': { schema: RepeatOffendersResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

// Admin users
const AdminRoleSchema = z.enum(['super-admin', 'ops-manager', 'finance', 'support-agent']).openapi('AdminRole');
const AdminUserListItemSchema = z.object({
  adminId: z.string(),
  email: z.string().email(),
  role: AdminRoleSchema,
  displayName: z.string().optional(),
  totpEnrolled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deactivatedAt: z.string().nullable(),
}).openapi('AdminUserListItem');
const PatchAdminUserBodySchema = z.object({
  role: AdminRoleSchema.optional(),
  displayName: z.string().min(1).max(100).optional(),
  deactivatedAt: z.string().nullable().optional(),
}).strict().openapi('PatchAdminUserBody');

registry.register('AdminRole', AdminRoleSchema);
registry.register('AdminUserListItem', AdminUserListItemSchema);
registry.register('PatchAdminUserBody', PatchAdminUserBodySchema);

registry.registerPath({
  method: 'get', path: '/v1/admin/users', operationId: 'adminListUsers',
  tags: ['admin-users'], summary: 'List admin users without secrets',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Admin users', content: { 'application/json': { schema: z.object({ users: z.array(AdminUserListItemSchema) }) } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'patch', path: '/v1/admin/users/{adminId}', operationId: 'adminPatchUser',
  tags: ['admin-users'], summary: 'Patch admin user role, display name, or activation state',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'adminId', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: PatchAdminUserBodySchema } } } },
  responses: {
    200: { description: 'Patched', content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Admin user not found' },
  },
});

// Compliance
const ErasureRequestDoc = ErasureRequestDocSchema.openapi('ErasureRequestDoc');
const AdminErasurePatchBody = AdminErasurePatchBodySchema.openapi('AdminErasurePatchBody');
const SscLevyDoc = SscLevyDocSchema.openapi('SscLevyDoc');
const SscLevyApproveResponse = z.object({
  levyId: z.string(),
  quarter: z.string(),
  transferId: z.string(),
  status: z.literal('TRANSFERRED'),
}).openapi('SscLevyApproveResponse');

registry.register('ErasureRequestDoc', ErasureRequestDoc);
registry.register('AdminErasurePatchBody', AdminErasurePatchBody);
registry.register('SscLevyDoc', SscLevyDoc);
registry.register('SscLevyApproveResponse', SscLevyApproveResponse);

registry.registerPath({
  method: 'get', path: '/v1/admin/erasure-requests', operationId: 'adminListErasureRequests',
  tags: ['compliance'], summary: 'List erasure requests',
  security: [{ cookieAuth: [] }],
  parameters: [
    { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
    { name: 'pageSize', in: 'query', required: false, schema: { type: 'integer', default: 50 } },
  ],
  responses: {
    200: { description: 'Erasure requests', content: { 'application/json': { schema: z.object({ items: z.array(ErasureRequestDoc) }) } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'patch', path: '/v1/admin/erasure-requests/{id}', operationId: 'adminPatchErasureRequest',
  tags: ['compliance'], summary: 'Execute or deny an erasure request',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: AdminErasurePatchBody } } } },
  responses: {
    200: { description: 'Erasure action accepted' },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Erasure request not found' },
    409: { description: 'Request is not pending or cool-off has not elapsed' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/compliance/ssc-levy', operationId: 'adminListSscLevies',
  tags: ['compliance'], summary: 'List SSC levies',
  security: [{ cookieAuth: [] }],
  parameters: [
    { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: SscLevyStatusSchema.options } },
    { name: 'pageSize', in: 'query', required: false, schema: { type: 'integer', default: 50 } },
  ],
  responses: {
    200: { description: 'SSC levies', content: { 'application/json': { schema: z.object({ levies: z.array(SscLevyDoc) }) } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/compliance/ssc-levy/{id}/approve', operationId: 'adminApproveSscLevy',
  tags: ['compliance'], summary: 'Approve SSC levy transfer',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Transfer created', content: { 'application/json': { schema: SscLevyApproveResponse } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'Levy not found' },
    409: { description: 'Invalid levy status' },
  },
});

// ── E21-S02: Commission ledger v2 (docType ledger, absolute recomputation) ─────
//
// Replaces the E21-S01 DUE-count dashboard + single-booking settle with a
// hold-based dashboard, a multi-booking remittance endpoint, ledger detail per
// technician, and a manual hold override. `commission-receivables/settle` is
// kept but narrowed to WAIVE-only (REMIT now returns 410 — see markCommissionReceived).

const AllocationEntrySchema = z.object({
  bookingId: z.string(),
  paise: z.number().int().positive(),
}).openapi('CommissionAllocationEntry');

const CommissionHoldOverrideSchema = z.object({
  until: z.string(),
  byAdminId: z.string(),
  reason: z.string(),
}).openapi('CommissionHoldOverride');

/** Response envelope for `POST /v1/admin/finance/commission-remittances`. */
const RecordRemittanceResponseSchema = z.object({
  remittance: RemittanceDocSchema,
  allocations: z.array(AllocationEntrySchema),
  creditCreatedPaise: z.number().int().nonnegative(),
  hold: CommissionHoldSchema.nullable(),
  holdRecomputePending: z.boolean(),
  replayed: z.boolean(),
}).openapi('RecordRemittanceResponse');

/** One row of the hold-based admin dashboard — a technician currently carrying a non-CLEAR
 *  state or a non-zero outstanding balance. */
const CommissionDashboardTechnicianEntrySchema = z.object({
  technicianId: z.string(),
  technicianName: z.string(),
  outstandingPaise: z.number().int().nonnegative(),
  dueCount: z.number().int().nonnegative(),
  oldestDueAt: z.string().optional(),
  state: HoldStateSchema,
  evaluatedAt: z.string(),
  override: CommissionHoldOverrideSchema.optional(),
}).openapi('CommissionDashboardTechnicianEntry');

const CommissionReceivablesDashboardV2Schema = z.object({
  technicians: z.array(CommissionDashboardTechnicianEntrySchema),
  totalOutstanding: z.number().int().nonnegative(),
  unreconciledTechnicianCount: z.number().int().nonnegative(),
  continuationToken: z.string().optional(),
}).openapi('CommissionReceivablesDashboardV2');

/** Full ledger detail for one technician — `GET .../commission-receivables/{technicianId}`. */
const CommissionLedgerDetailSchema = z.object({
  technicianId: z.string(),
  hold: CommissionHoldSchema.nullable(),
  receivables: z.array(CommissionReceivableEntrySchema.extend({ outstandingPaise: z.number().int().nonnegative() })),
  remittances: z.array(RemittanceDocSchema),
  credits: z.array(CreditDocSchema),
  cashCollectedPaise: z.number().int().nonnegative(),
  creditAppliedPaise: z.number().int().nonnegative(),
}).openapi('CommissionLedgerDetail');

const SetCommissionHoldOverrideBodySchema = z.object({
  until: z.string().datetime(),
  reason: z.string().min(1).max(200),
}).openapi('SetCommissionHoldOverrideBody');

const CommissionHoldResponseSchema = z.object({
  hold: CommissionHoldSchema.nullable(),
}).openapi('CommissionHoldResponse');

registry.register('EffectiveCommissionConfig', EffectiveCommissionConfigSchema.openapi('EffectiveCommissionConfig'));
registry.register('UpdateCommissionConfigBody', UpdateCommissionConfigBodySchema.openapi('UpdateCommissionConfigBody'));
registry.register('RecordRemittanceBody', RecordRemittanceBodySchema.openapi('RecordRemittanceBody'));
registry.register('RemittanceDoc', RemittanceDocSchema.openapi('RemittanceDoc'));
registry.register('CreditDoc', CreditDocSchema.openapi('CreditDoc'));
registry.register('CommissionHold', CommissionHoldSchema.openapi('CommissionHold'));
registry.register('CommissionReceivableEntry', CommissionReceivableEntrySchema.openapi('CommissionReceivableEntry'));
registry.register('MarkCommissionReceivedBody', MarkCommissionReceivedBodySchema.openapi('MarkCommissionReceivedBody'));
registry.register('TechnicianCommissionDueV2', TechnicianCommissionDueV2Schema.openapi('TechnicianCommissionDueV2'));
registry.register('TechnicianConfigResponse', TechnicianConfigResponseSchema.openapi('TechnicianConfigResponse'));

registry.registerPath({
  method: 'get', path: '/v1/admin/catalogue/commission-config', operationId: 'getAdminCommissionConfig',
  tags: ['admin-catalogue'], summary: 'Get the effective global commission config (rate + thresholds + flags)',
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Effective commission config, defaults applied for any unset field', content: { 'application/json': { schema: EffectiveCommissionConfigSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'put', path: '/v1/admin/catalogue/commission-config', operationId: 'putAdminCommissionConfig',
  tags: ['admin-catalogue'], summary: 'Update the global commission rate and/or hold thresholds/flags (super-admin only)',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateCommissionConfigBodySchema } } } },
  responses: {
    200: { description: 'Updated effective commission config', content: { 'application/json': { schema: EffectiveCommissionConfigSchema } } },
    400: { description: 'Validation error (bps out of 1500–3500 range, or warnThresholdPaise >= blockThresholdPaise)' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden (requires super-admin)' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/finance/commission-remittances', operationId: 'recordCommissionRemittance',
  tags: ['admin-finance'], summary: 'Record a technician cash/UPI remittance and allocate it against outstanding receivables',
  description:
    'Idempotent on `idempotencyKey` (client-generated UUID, scoped per technician). A replayed ' +
    'call with the same key and the same amount/method/ref returns the original receipt ' +
    '(`replayed: true`) without re-applying credit. Overpayment beyond the oldest-due allocation ' +
    'creates a CREDIT doc consumed by future dues. The hold recompute is best-effort: failure ' +
    'never fails the remittance — the technician is queued for the async hold-repair sweep and ' +
    '`holdRecomputePending` is set instead.',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: RecordRemittanceBodySchema } } } },
  responses: {
    200: { description: 'Remittance recorded (or replayed)', content: { 'application/json': { schema: RecordRemittanceResponseSchema } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'TECHNICIAN_NOT_FOUND' },
    409: { description: 'IDEMPOTENCY_MISMATCH (same key, different amount/method/ref) or LEDGER_BUSY (ETag contention exhausted retries)' },
    502: { description: 'Upstream Cosmos error' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/finance/commission-receivables', operationId: 'adminCommissionReceivablesDashboard',
  tags: ['admin-finance'], summary: 'Hold-based admin dashboard — technicians currently carrying a commission hold',
  description:
    'One page of technicians with a non-CLEAR state or non-zero outstanding balance. ' +
    '`unreconciledTechnicianCount` is computed across the full roster (not just this page), so ' +
    'it never depends on which page an admin happens to be viewing.',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'continuationToken', in: 'query', required: false, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Per-tech hold summary + total outstanding', content: { 'application/json': { schema: CommissionReceivablesDashboardV2Schema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/finance/commission-receivables/recompute', operationId: 'adminCommissionReceivablesRecompute',
  tags: ['admin-finance'], summary: 'Enqueue a full hold-repair sweep across every technician (super-admin only)',
  security: [{ cookieAuth: [] }],
  responses: {
    202: { description: 'Sweep queued', content: { 'application/json': { schema: z.object({ queued: z.literal(true) }) } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/finance/commission-receivables/{technicianId}', operationId: 'adminCommissionReceivablesPerTech',
  tags: ['admin-finance'], summary: 'Full ledger detail (receivables + remittances + credits) for one technician',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'technicianId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Ledger detail', content: { 'application/json': { schema: CommissionLedgerDetailSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/finance/commission-receivables/settle', operationId: 'markCommissionReceived',
  tags: ['admin-finance'], summary: 'Waive a technician\'s commission for a booking (REMIT retired — use commission-remittances)',
  description:
    'WAIVE-only. `action: "REMIT"` now returns 410 — record remittances via the dedicated ' +
    '`POST /v1/admin/finance/commission-remittances` endpoint instead, which allocates one ' +
    'payment across multiple outstanding bookings rather than settling one at a time.',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: MarkCommissionReceivedBodySchema } } } },
  responses: {
    200: { description: 'Updated receivable entry', content: { 'application/json': { schema: CommissionReceivableEntrySchema } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'RECEIVABLE_NOT_FOUND' },
    409: { description: 'LEDGER_BUSY' },
    410: { description: 'action: "REMIT" is retired — use POST /v1/admin/finance/commission-remittances', content: { 'application/json': { schema: z.object({ code: z.literal('USE_COMMISSION_REMITTANCES') }) } } },
  },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/finance/commission-hold/{technicianId}/override', operationId: 'setCommissionHoldOverride',
  tags: ['admin-finance'], summary: 'Force a technician\'s commission hold to CLEAR until a given time (super-admin only)',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'technicianId', in: 'path', required: true, schema: { type: 'string' } }],
  request: { body: { content: { 'application/json': { schema: SetCommissionHoldOverrideBodySchema } } } },
  responses: {
    200: { description: 'Hold recomputed with the override applied', content: { 'application/json': { schema: CommissionHoldResponseSchema } } },
    400: { description: 'Validation error' },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'TECHNICIAN_NOT_FOUND' },
    409: { description: 'LEDGER_BUSY (conditional-patch retries exhausted)' },
  },
});

registry.registerPath({
  method: 'delete', path: '/v1/admin/finance/commission-hold/{technicianId}/override', operationId: 'clearCommissionHoldOverride',
  tags: ['admin-finance'], summary: 'Clear a technician\'s commission hold override (super-admin only)',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'technicianId', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: { description: 'Hold recomputed with the override cleared', content: { 'application/json': { schema: CommissionHoldResponseSchema } } },
    401: { description: 'Unauthenticated' },
    403: { description: 'Forbidden' },
    404: { description: 'TECHNICIAN_NOT_FOUND' },
    409: { description: 'LEDGER_BUSY (conditional-patch retries exhausted)' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/technicians/me/commission-due', operationId: 'techCommissionDue',
  tags: ['technicians'], summary: 'Technician\'s net outstanding commission, ledger, and week summary (v2)',
  description:
    'Field names of the v1 response are preserved (`totalOutstandingPaise`, `dueCount`, ' +
    '`entries[].bookingId/bookingAmount/commissionDue/createdAt`) so old APKs keep parsing what ' +
    'they already read — but `totalOutstandingPaise` is now NET of partial remittances/credits.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Net outstanding commission summary + ledger + week summary', content: { 'application/json': { schema: TechnicianCommissionDueV2Schema } } },
    401: { description: 'Unauthenticated' },
  },
});

registry.registerPath({
  method: 'get', path: '/v1/config/technician', operationId: 'getTechnicianConfig',
  tags: ['config'], summary: 'Technician-app remote config: feature flags, hold thresholds, incentive program',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Technician client config (60s in-process cache)', content: { 'application/json': { schema: TechnicianConfigResponseSchema } } },
    401: { description: 'Unauthenticated' },
  },
});

// ── Waitlist (E16-S04/WS-F) ───────────────────────────────────────────────────

const WaitlistRequestBodySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/).openapi({ example: '+916000000001' }),
  lat: z.number().min(-90).max(90).openapi({ example: 26.7 }),
  lng: z.number().min(-180).max(180).openapi({ example: 82.1 }),
  serviceId: z.string().min(1).max(64).openapi({ example: 'ac-deep-clean' }),
  requestedAt: z.string().datetime().openapi({ example: '2026-05-17T10:00:00.000Z' }),
}).openapi('WaitlistRequest');

const WaitlistSuccessSchema = z.object({
  ok: z.literal(true),
}).openapi('WaitlistSuccess');

const WaitlistErrorSchema = z.object({
  code: z.enum(['VALIDATION_ERROR', 'UNKNOWN_SERVICE', 'CLOCK_SKEW', 'RATE_LIMITED', 'INVALID_JSON', 'INTERNAL_ERROR']),
}).openapi('WaitlistError');

registry.register('WaitlistRequest', WaitlistRequestBodySchema);
registry.register('WaitlistSuccess', WaitlistSuccessSchema);
registry.register('WaitlistError', WaitlistErrorSchema);

registry.registerPath({
  method: 'post',
  path: '/v1/waitlist',
  operationId: 'joinWaitlist',
  tags: ['waitlist'],
  summary: 'Join the service waitlist for a specific area',
  description:
    'Adds a customer to the waitlist for a service in their location. ' +
    'No authentication required. Rate-limited to 5 requests/hr per phone number ' +
    'and 50 requests/hr per IP. requestedAt must be within ±90 s of server time.',
  request: {
    body: {
      content: { 'application/json': { schema: WaitlistRequestBodySchema } },
    },
  },
  responses: {
    201: {
      description: 'Successfully joined the waitlist',
      content: { 'application/json': { schema: WaitlistSuccessSchema } },
    },
    400: {
      description: 'Validation error, unknown serviceId, or clock skew > 90 s',
      content: { 'application/json': { schema: WaitlistErrorSchema } },
    },
    429: {
      description: 'Rate limit exceeded — check Retry-After header',
      headers: {
        'Retry-After': { schema: { type: 'integer' }, description: 'Seconds until the rate limit resets' },
      },
      content: { 'application/json': { schema: WaitlistErrorSchema } },
    },
  },
});
