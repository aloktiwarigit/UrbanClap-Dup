import { describe, it, expect, vi, beforeEach } from 'vitest';

// Task 10 (E21-S03): the admin roster endpoint now projects `commissionHold` straight from the
// stored technician document (E21-S02 already writes it) instead of the roster having no hold
// visibility at all. This must stay `undefined` — never a fabricated CLEAR — for a technician
// whose hold has never been computed, because the finance dashboard's own paginated projection
// of this same field already burned a fix round on exactly that kind of false-CLEAR bug.

vi.mock('../../../../src/cosmos/technician-repository.js', () => ({
  listAllTechniciansForAdmin: vi.fn(),
}));
vi.mock('../../../../src/cosmos/booking-repository.js', () => ({
  getActiveBookingCountForTechnician: vi.fn(),
}));
vi.mock('../../../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(),
}));

import { HttpRequest } from '@azure/functions';
import { adminListTechniciansHandler } from '../../../../src/functions/admin/technicians/list.js';
import { listAllTechniciansForAdmin } from '../../../../src/cosmos/technician-repository.js';
import { getActiveBookingCountForTechnician } from '../../../../src/cosmos/booking-repository.js';
import { getFirebaseAdmin } from '../../../../src/services/firebaseAdmin.js';

function req(): HttpRequest {
  return new HttpRequest({ url: 'http://localhost/api/v1/admin/technicians', method: 'GET' });
}

describe('adminListTechniciansHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      auth: () => ({ getUsers: vi.fn().mockResolvedValue({ users: [] }) }),
    } as unknown as ReturnType<typeof getFirebaseAdmin>);
    vi.mocked(getActiveBookingCountForTechnician).mockResolvedValue(0);
  });

  it('projects commissionHold from the stored doc when present', async () => {
    const hold = {
      outstandingPaise: 134780,
      dueCount: 2,
      state: 'BLOCKED' as const,
      evaluatedAt: '2026-09-01T00:00:00.000Z',
    };
    vi.mocked(listAllTechniciansForAdmin).mockResolvedValue([
      { id: 't1', displayName: 'Suresh', commissionHold: hold },
    ]);

    const res = await adminListTechniciansHandler(req(), {} as any, {
      adminId: 'a1',
      role: 'super-admin',
      sessionId: 's1',
    });

    expect(res.status).toBe(200);
    const technicians = (res.jsonBody as any).technicians;
    expect(technicians[0].commissionHold).toEqual(hold);
  });

  it('leaves commissionHold undefined — never a fabricated CLEAR — when the doc has none', async () => {
    vi.mocked(listAllTechniciansForAdmin).mockResolvedValue([
      { id: 't2', displayName: 'Priya' },
    ]);

    const res = await adminListTechniciansHandler(req(), {} as any, {
      adminId: 'a1',
      role: 'super-admin',
      sessionId: 's1',
    });

    const technicians = (res.jsonBody as any).technicians;
    expect(technicians[0].commissionHold).toBeUndefined();
  });
});
