import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  upsertTechnicianProfile: vi.fn(),
  getTechniciansWithinRadius: vi.fn(),
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { patchFcmTokenHandler } from '../../src/functions/technicians.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { getCosmosClient } from '../../src/cosmos/client.js';
import type { HttpRequest } from '@azure/functions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, authHeader?: string): HttpRequest {
  const headers = new Map<string, string>();
  if (authHeader) headers.set('Authorization', authHeader);
  return {
    headers: { get: (k: string) => headers.get(k) ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as HttpRequest;
}

function makeCosmosContainer(existingDoc: unknown = null) {
  const item = {
    read: vi.fn().mockResolvedValue({ resource: existingDoc }),
    replace: vi.fn().mockResolvedValue({ resource: existingDoc }),
  };
  return {
    item: vi.fn().mockReturnValue(item),
    items: { upsert: vi.fn().mockResolvedValue({}) },
    _item: item,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /v1/technicians/fcm-token', () => {
  let container: ReturnType<typeof makeCosmosContainer>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = makeCosmosContainer({ id: 'tech-uid-1', technicianId: 'tech-uid-1' });
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: () => container }),
    } as any);
  });

  it('returns 401 when no Authorization header', async () => {
    const req = makeRequest({ fcmToken: 'tok-abc' });
    const res = await patchFcmTokenHandler(req, {} as any);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Firebase token is invalid', async () => {
    vi.mocked(verifyFirebaseIdToken).mockRejectedValue(new Error('Token expired'));

    const req = makeRequest({ fcmToken: 'tok-abc' }, 'Bearer bad-token');
    const res = await patchFcmTokenHandler(req, {} as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when fcmToken is missing from body', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);

    const req = makeRequest({}, 'Bearer valid-token');
    const res = await patchFcmTokenHandler(req, {} as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 and upserts fcmToken on the technician document', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);

    const existing = {
      id: 'tech-uid-1',
      technicianId: 'tech-uid-1',
      location: { type: 'Point', coordinates: [77.59, 12.97] },
      skills: ['svc-plumbing'],
      availabilityWindows: [],
      isOnline: true,
      isAvailable: true,
      kycStatus: 'APPROVED',
    };
    container._item.read.mockResolvedValue({ resource: existing });

    const req = makeRequest({ fcmToken: 'fcm-token-fresh' }, 'Bearer valid-token');
    const res = await patchFcmTokenHandler(req, {} as any);

    expect(res.status).toBe(200);
    expect(container.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ fcmToken: 'fcm-token-fresh', id: 'tech-uid-1' }),
    );
  });
});
