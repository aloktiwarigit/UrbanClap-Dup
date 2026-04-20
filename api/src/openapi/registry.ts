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
