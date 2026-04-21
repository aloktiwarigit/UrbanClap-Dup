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

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

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
