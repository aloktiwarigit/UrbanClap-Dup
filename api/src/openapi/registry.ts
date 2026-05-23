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
