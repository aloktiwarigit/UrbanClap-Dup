import { z } from 'zod';
import { registry } from './registry.js';
import { LoginRequestSchema, SetupTotpVerifySchema } from '../schemas/admin-auth.js';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

const LoginRequest = LoginRequestSchema.openapi('AdminLoginRequest');
const SetupTotpVerify = SetupTotpVerifySchema.openapi('AdminSetupTotpVerifyRequest');

const AdminMeResponse = z
  .object({ adminId: z.string(), email: z.string(), role: z.string() })
  .openapi('AdminMeResponse');

registry.registerPath({
  method: 'post', path: '/v1/admin/auth/login', operationId: 'adminLogin',
  tags: ['admin-auth'], summary: 'Email + password + TOTP login',
  request: { body: { content: { 'application/json': { schema: LoginRequest } } } },
  responses: { 200: { description: 'Login success or setup required' } },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/auth/setup-totp', operationId: 'adminSetupTotpGet',
  tags: ['admin-auth'], summary: 'Get TOTP enrollment QR code',
  responses: { 200: { description: 'QR code data URI' } },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/auth/setup-totp', operationId: 'adminSetupTotpPost',
  tags: ['admin-auth'], summary: 'Complete TOTP enrollment',
  request: { body: { content: { 'application/json': { schema: SetupTotpVerify } } } },
  responses: { 200: { description: 'Enrollment complete, session cookies set' } },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/auth/refresh', operationId: 'adminRefresh',
  tags: ['admin-auth'], summary: 'Refresh access token',
  responses: { 200: { description: 'New hs_access cookie set' } },
});

registry.registerPath({
  method: 'post', path: '/v1/admin/auth/logout', operationId: 'adminLogout',
  tags: ['admin-auth'], summary: 'Invalidate session',
  responses: { 200: { description: 'Cookies cleared' } },
});

registry.registerPath({
  method: 'get', path: '/v1/admin/me', operationId: 'adminMe',
  tags: ['admin-auth'], summary: 'Current admin profile',
  responses: { 200: { description: 'Admin profile', content: { 'application/json': { schema: AdminMeResponse } } } },
});
