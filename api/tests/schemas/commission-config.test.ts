import { describe, it, expect } from 'vitest';
import {
  COMMISSION_CONFIG_DOC_ID,
  CommissionConfigDocSchema,
  UpdateCommissionConfigBodySchema,
  CommissionResolvedFromSchema,
} from '../../src/schemas/commission-config.js';

const validDoc = {
  id: COMMISSION_CONFIG_DOC_ID,
  defaultCommissionBps: 2200,
  updatedBy: 'uid-123',
  updatedAt: '2026-05-24T00:00:00.000Z',
};

describe('CommissionConfigDocSchema', () => {
  it('parses a valid config doc', () => {
    expect(() => CommissionConfigDocSchema.parse(validDoc)).not.toThrow();
  });

  it('forces the fixed singleton id', () => {
    expect(() => CommissionConfigDocSchema.parse({ ...validDoc, id: 'other' })).toThrow();
  });

  it('rejects bps below 1500', () => {
    expect(() => CommissionConfigDocSchema.parse({ ...validDoc, defaultCommissionBps: 1499 })).toThrow();
  });

  it('rejects bps above 3500', () => {
    expect(() => CommissionConfigDocSchema.parse({ ...validDoc, defaultCommissionBps: 3501 })).toThrow();
  });

  it('rejects non-integer bps', () => {
    expect(() => CommissionConfigDocSchema.parse({ ...validDoc, defaultCommissionBps: 2200.5 })).toThrow();
  });

  it('rejects unknown keys (strict)', () => {
    expect(() => CommissionConfigDocSchema.parse({ ...validDoc, extra: true })).toThrow();
  });
});

describe('UpdateCommissionConfigBodySchema', () => {
  it('accepts a valid default bps', () => {
    expect(() => UpdateCommissionConfigBodySchema.parse({ defaultCommissionBps: 2500 })).not.toThrow();
  });

  it('rejects out-of-range bps', () => {
    expect(() => UpdateCommissionConfigBodySchema.parse({ defaultCommissionBps: 5000 })).toThrow();
  });

  it('rejects extra fields (strict)', () => {
    expect(() =>
      UpdateCommissionConfigBodySchema.parse({ defaultCommissionBps: 2200, updatedBy: 'x' }),
    ).toThrow();
  });
});

describe('CommissionResolvedFromSchema', () => {
  it('accepts SERVICE, CATEGORY, GLOBAL', () => {
    expect(CommissionResolvedFromSchema.parse('SERVICE')).toBe('SERVICE');
    expect(CommissionResolvedFromSchema.parse('CATEGORY')).toBe('CATEGORY');
    expect(CommissionResolvedFromSchema.parse('GLOBAL')).toBe('GLOBAL');
  });

  it('rejects unknown source', () => {
    expect(() => CommissionResolvedFromSchema.parse('DEFAULT')).toThrow();
  });
});
