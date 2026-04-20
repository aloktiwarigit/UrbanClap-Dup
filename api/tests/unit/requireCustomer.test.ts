import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn().mockImplementation(async (token: string) => {
    if (token === 'valid-token') return { uid: 'cust-uid-1' };
    throw new Error('INVALID_TOKEN');
  }),
}));

import { requireCustomer } from '../../src/middleware/requireCustomer.js';

function req(auth?: string) {
  return new HttpRequest({
    url: 'http://localhost/test',
    method: 'POST',
    headers: auth ? { authorization: auth } : {},
  });
}
const ctx = {} as never;

describe('requireCustomer', () => {
  it('returns 401 when Authorization header absent', async () => {
    const res = await requireCustomer(async (_r, _c, c) => ({ status: 200, jsonBody: { id: c.customerId } }))(req(), ctx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token invalid', async () => {
    const res = await requireCustomer(async (_r, _c, c) => ({ status: 200, jsonBody: { id: c.customerId } }))(req('Bearer bad'), ctx);
    expect(res.status).toBe(401);
    expect((res.jsonBody as { code: string }).code).toBe('TOKEN_INVALID');
  });

  it('passes customerId to handler on valid token', async () => {
    const res = await requireCustomer(async (_r, _c, c) => ({ status: 200, jsonBody: { id: c.customerId } }))(req('Bearer valid-token'), ctx);
    expect(res.status).toBe(200);
    expect((res.jsonBody as { id: string }).id).toBe('cust-uid-1');
  });
});
