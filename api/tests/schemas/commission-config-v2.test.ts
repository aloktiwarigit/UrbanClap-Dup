import { describe, it, expect } from 'vitest';
import { CommissionConfigDocSchema, UpdateCommissionConfigBodySchema, toEffectiveConfig } from '../../src/schemas/commission-config.js';
import { TechnicianProfileSchema } from '../../src/schemas/technician.js';

describe('commission config v2', () => {
  it('still parses the E21-S01 four-field doc and fills defaults', () => {
    const doc = CommissionConfigDocSchema.parse({ id: 'commission-config', defaultCommissionBps: 2200, updatedBy: 'system', updatedAt: '2026-09-05T00:00:00.000Z' });
    const eff = toEffectiveConfig(doc);
    expect(eff).toMatchObject({ warnThresholdPaise: 250000, blockThresholdPaise: 500000, holdEnforcementEnabled: false, enforceKycInDispatch: false });
  });
  it('rejects warn >= block on the PUT body', () => {
    expect(UpdateCommissionConfigBodySchema.safeParse({ warnThresholdPaise: 500000, blockThresholdPaise: 500000 }).success).toBe(false);
    expect(UpdateCommissionConfigBodySchema.safeParse({ warnThresholdPaise: 100000 }).success).toBe(true);
  });
  it('technician profile accepts commissionHold and paymentProfile', () => {
    const p = TechnicianProfileSchema.parse({
      id: 't1', technicianId: 't1', location: { type: 'Point', coordinates: [82.1, 26.7] }, skills: ['ac-deep-clean'],
      availabilityWindows: [], isOnline: true, isAvailable: true, kycStatus: 'APPROVED',
      commissionHold: { outstandingPaise: 0, dueCount: 0, state: 'CLEAR', evaluatedAt: '2026-09-05T00:00:00.000Z' },
      paymentProfile: { upiVpa: 'ram@ybl', upiUpdatedAt: '2026-09-05T00:00:00.000Z' },
    });
    expect(p.commissionHold?.state).toBe('CLEAR');
  });
});
