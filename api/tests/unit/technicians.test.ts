import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechniciansWithinRadius: vi.fn(),
  getTechnicianServiceProfile: vi.fn(),
  patchTechnicianServiceProfile: vi.fn(),
  patchFcmToken: vi.fn(),
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getMyTechnicianServiceProfileHandler,
  patchFcmTokenHandler,
  patchMyTechnicianServiceProfileHandler,
} from '../../src/functions/technicians.js';
import { verifyFirebaseIdToken } from '../../src/services/firebaseAdmin.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import {
  getTechnicianServiceProfile,
  patchFcmToken,
  patchTechnicianServiceProfile,
} from '../../src/cosmos/technician-repository.js';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /v1/technicians/fcm-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(patchFcmToken).not.toHaveBeenCalled();
  });

  it('returns 200 and calls patchFcmToken(uid, token) — the ETag-guarded repo write', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);
    vi.mocked(patchFcmToken).mockResolvedValue(undefined);

    const req = makeRequest({ fcmToken: 'fcm-token-fresh' }, 'Bearer valid-token');
    const res = await patchFcmTokenHandler(req, {} as any);

    expect(res.status).toBe(200);
    expect(patchFcmToken).toHaveBeenCalledWith('tech-uid-1', 'fcm-token-fresh');
  });
});

describe('GET /v1/technicians/me/service-profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns current skills and location', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);
    vi.mocked(getTechnicianServiceProfile).mockResolvedValue({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });

    const req = makeRequest(undefined, 'Bearer valid-token');
    const res = await getMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(getTechnicianServiceProfile).toHaveBeenCalledWith('tech-uid-1');
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({
      skills: ['svc-plumbing'],
      location: { lat: 12.9716, lng: 77.5946 },
    });
  });

  it('returns empty profile when repository has no document', async () => {
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);
    vi.mocked(getTechnicianServiceProfile).mockResolvedValue({ skills: [], location: null });

    const req = makeRequest(undefined, 'Bearer valid-token');
    const res = await getMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({ skills: [], location: null });
  });
});

describe('PATCH /v1/technicians/me/service-profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyFirebaseIdToken).mockResolvedValue({ uid: 'tech-uid-1' } as any);
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({
      id: 'svc-plumbing',
      name: 'Plumbing',
      isActive: true,
    } as any);
  });

  it('validates active catalogue services and patches profile', async () => {
    const body = { skills: ['svc-plumbing'], location: { lat: 12.9716, lng: 77.5946 } };
    vi.mocked(patchTechnicianServiceProfile).mockResolvedValue(body);

    const req = makeRequest(body, 'Bearer valid-token');
    const res = await patchMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(catalogueRepo.getServiceByIdCrossPartition).toHaveBeenCalledWith('svc-plumbing');
    expect(patchTechnicianServiceProfile).toHaveBeenCalledWith('tech-uid-1', { ...body, location: body.location ?? undefined });
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual(body);
  });

  it('rejects missing or empty skills before repository write', async () => {
    const req = makeRequest({ skills: [] }, 'Bearer valid-token');
    const res = await patchMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(patchTechnicianServiceProfile).not.toHaveBeenCalled();
  });

  it('rejects duplicate skills before catalogue lookup', async () => {
    const req = makeRequest({ skills: ['svc-plumbing', 'svc-plumbing'] }, 'Bearer valid-token');
    const res = await patchMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(catalogueRepo.getServiceByIdCrossPartition).not.toHaveBeenCalled();
  });

  it('rejects inactive or unknown catalogue services', async () => {
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ isActive: false } as any);

    const req = makeRequest({ skills: ['svc-disabled'] }, 'Bearer valid-token');
    const res = await patchMyTechnicianServiceProfileHandler(req, { warn: vi.fn(), error: vi.fn() } as any) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect(res.jsonBody).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(patchTechnicianServiceProfile).not.toHaveBeenCalled();
  });
});
