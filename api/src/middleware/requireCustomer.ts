import type { HttpHandler, HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';
import type { CustomerContext } from '../types/customer.js';

export type CustomerHttpHandler = (
  req: HttpRequest,
  ctx: InvocationContext,
  customer: CustomerContext,
) => Promise<HttpResponseInit>;

export function requireCustomer(handler: CustomerHttpHandler): HttpHandler {
  return async (req, ctx) => {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };
    try {
      const decoded: DecodedIdToken = await verifyFirebaseIdToken(auth.slice(7));
      return handler(req, ctx, { customerId: decoded.uid });
    } catch {
      return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
    }
  };
}
