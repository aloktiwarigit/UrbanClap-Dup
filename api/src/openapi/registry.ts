import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { HealthResponseSchema } from '../schemas/health.js';

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
