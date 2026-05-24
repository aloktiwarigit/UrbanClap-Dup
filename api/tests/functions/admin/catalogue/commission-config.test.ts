import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpResponseInit } from '@azure/functions';
import { HttpRequest } from '@azure/functions';

vi.mock('../../../../src/cosmos/commission-config-repository.js');
vi.mock('../../../../src/services/commission-config.service.js');

import { commissionConfigRepo } from '../../../../src/cosmos/commission-config-repository.js';
import * as configSvc from '../../../../src/services/commission-config.service.js';
import {
  getCommissionConfigHandler,
  putCommissionConfigHandler,
} from '../../../../src/functions/admin/catalogue/commission-config.js';

const superAdmin = { adminId: 'admin-1', role: 'super-admin' as const, sessionId: 's1' };
const financeAdmin = { adminId: 'admin-2', role: 'finance' as const, sessionId: 's2' };

const configDoc = {
  id: 'commission-config' as const,
  defaultCommissionBps: 2200,
  updatedBy: 'admin-1',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

beforeEach(() => vi.clearAllMocks());

describe('getCommissionConfigHandler', () => {
  const req = new HttpRequest({ url: 'http://localhost/api/v1/admin/catalogue/commission-config', method: 'GET' });

  it('returns the stored config when a doc exists', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue(configDoc);

    const res = (await getCommissionConfigHandler(req, {} as never, superAdmin)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { defaultCommissionBps: number }).defaultCommissionBps).toBe(2200);
  });

  it('returns default 2200 with isDefault=true when no config doc exists', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockResolvedValue(null);

    const res = (await getCommissionConfigHandler(req, {} as never, superAdmin)) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { defaultCommissionBps: number }).defaultCommissionBps).toBe(2200);
    expect((res.jsonBody as { isDefault: boolean }).isDefault).toBe(true);
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionConfigRepo.getCommissionConfig).mockRejectedValue(new Error('timeout'));

    const res = (await getCommissionConfigHandler(req, {} as never, superAdmin)) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});

describe('putCommissionConfigHandler', () => {
  function makePutReq(body: unknown): HttpRequest {
    return new HttpRequest({
      url: 'http://localhost/api/v1/admin/catalogue/commission-config',
      method: 'PUT',
      body: { string: JSON.stringify(body) },
      headers: { 'content-type': 'application/json' },
    });
  }

  it('updates config and busts the in-process cache', async () => {
    vi.mocked(commissionConfigRepo.upsertCommissionConfig).mockResolvedValue({
      ...configDoc, defaultCommissionBps: 2500,
    });

    const res = (await putCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2500 }),
      {} as never,
      superAdmin,
    )) as HttpResponseInit;

    expect(res.status).toBe(200);
    expect((res.jsonBody as { defaultCommissionBps: number }).defaultCommissionBps).toBe(2500);
    expect(configSvc._resetCommissionConfigCacheForTest).toHaveBeenCalled();
  });

  it('returns 400 for bps below minimum (1500)', async () => {
    const res = (await putCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 1000 }),
      {} as never,
      superAdmin,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for bps above maximum (3500)', async () => {
    const res = (await putCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 4000 }),
      {} as never,
      superAdmin,
    )) as HttpResponseInit;

    expect(res.status).toBe(400);
  });

  it('passes adminId to the repository upsert', async () => {
    vi.mocked(commissionConfigRepo.upsertCommissionConfig).mockResolvedValue({
      ...configDoc, updatedBy: 'admin-2',
    });

    await putCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2200 }),
      {} as never,
      financeAdmin,
    );

    expect(commissionConfigRepo.upsertCommissionConfig).toHaveBeenCalledWith(
      2200,
      'admin-2',
    );
  });

  it('returns 502 on upstream error', async () => {
    vi.mocked(commissionConfigRepo.upsertCommissionConfig).mockRejectedValue(new Error('timeout'));

    const res = (await putCommissionConfigHandler(
      makePutReq({ defaultCommissionBps: 2200 }),
      {} as never,
      superAdmin,
    )) as HttpResponseInit;

    expect(res.status).toBe(502);
  });
});
