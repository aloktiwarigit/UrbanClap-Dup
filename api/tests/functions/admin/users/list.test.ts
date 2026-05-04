import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../../../src/services/adminUser.service.js', () => ({
  listAdminUsers: vi.fn(),
}));

import { adminListUsersHandler } from '../../../../src/functions/admin/users/list.js';
import { listAdminUsers } from '../../../../src/services/adminUser.service.js';
import type { AdminContext } from '../../../../src/types/admin.js';

const fakeCtx = {} as InvocationContext;
const superAdmin: AdminContext = { adminId: 'super-1', role: 'super-admin', sessionId: 'sess-1' };
const opsManager: AdminContext = { adminId: 'ops-1', role: 'ops-manager', sessionId: 'sess-2' };

function makeReq(): HttpRequest {
  return new HttpRequest({
    url: 'http://localhost/api/v1/admin/users',
    method: 'GET',
  });
}

describe('adminListUsersHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 for non-super-admin callers', async () => {
    const res = await adminListUsersHandler(makeReq(), fakeCtx, opsManager);

    expect(res.status).toBe(403);
    expect(listAdminUsers).not.toHaveBeenCalled();
  });

  it('returns users without TOTP secrets', async () => {
    vi.mocked(listAdminUsers).mockResolvedValue([
      {
        adminId: 'admin-1',
        email: 'admin@example.com',
        role: 'super-admin',
        displayName: 'Owner',
        totpEnrolled: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        deactivatedAt: null,
      },
    ]);

    const res = await adminListUsersHandler(makeReq(), fakeCtx, superAdmin);

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      users: [
        {
          adminId: 'admin-1',
          email: 'admin@example.com',
          role: 'super-admin',
          displayName: 'Owner',
          totpEnrolled: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deactivatedAt: null,
        },
      ],
    });
    expect(JSON.stringify(res.jsonBody)).not.toContain('totpSecret');
  });
});
