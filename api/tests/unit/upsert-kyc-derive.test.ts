import { describe, it, expect, vi, beforeEach } from 'vitest';

const replace = vi.fn().mockResolvedValue({});
const create = vi.fn().mockResolvedValue({});
const read = vi.fn();

vi.mock('../../src/cosmos/client.js', () => ({
  DB_NAME: 'homeservices',
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        item: () => ({ read, replace }),
        items: { create },
      }),
    }),
  }),
}));

const { upsertKycStepAndDeriveStatus } = await import('../../src/cosmos/technician-repository.js');

describe('upsertKycStepAndDeriveStatus', () => {
  beforeEach(() => {
    replace.mockClear();
    create.mockClear();
    read.mockReset();
  });

  it('derives COMPLETE when the incoming PAN completes an existing Aadhaar', async () => {
    read.mockResolvedValue({
      resource: { id: 't1', kyc: { aadhaarVerified: true, panHash: null } },
      etag: 'e1',
    });

    const status = await upsertKycStepAndDeriveStatus('t1', { panHash: 'c'.repeat(64) });

    expect(status).toBe('COMPLETE');
    expect(replace.mock.calls[0]![0].kyc.kycStatus).toBe('COMPLETE');
  });

  it('derives AADHAAR_DONE when Aadhaar lands with no PAN yet', async () => {
    read.mockResolvedValue({ resource: { id: 't1', kyc: {} }, etag: 'e1' });

    const status = await upsertKycStepAndDeriveStatus('t1', { aadhaarVerified: true });

    expect(status).toBe('AADHAAR_DONE');
    expect(replace.mock.calls[0]![0].kyc.kycStatus).toBe('AADHAAR_DONE');
  });

  it('derives from the MERGED document, not the patch alone', async () => {
    // The patch carries only the PAN; the Aadhaar fact exists only on the stored document.
    // Deriving from the patch would wrongly yield PAN_DONE.
    read.mockResolvedValue({
      resource: { id: 't1', kyc: { aadhaarVerified: true, panHash: null } },
      etag: 'e1',
    });

    const status = await upsertKycStepAndDeriveStatus('t1', { panHash: 'd'.repeat(64) });

    expect(status).toBe('COMPLETE');
  });
});
