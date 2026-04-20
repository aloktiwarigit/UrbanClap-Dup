import { describe, it, expect } from 'vitest';
import {
  ServiceSchema,
  ServiceDetailSchema,
  ServiceCardSchema,
} from '../../src/schemas/service.js';

const validService = {
  id: 'ac-deep-clean',
  categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  shortDescription: 'Chemical wash, gas check, filter clean.',
  heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/svc.jpg',
  basePrice: 59900,
  commissionBps: 2250,
  durationMinutes: 90,
  includes: ['Chemical wash', 'Gas pressure check'],
  faq: [{ question: 'What is included?', answer: 'Full AC service.' }],
  addOns: [{ id: 'gas-refill', name: 'Gas Refill', price: 149900, triggerCondition: 'if pressure < threshold' }],
  photoStages: [{ id: 'before', label: 'Unit before service', required: true }],
  isActive: true,
  updatedBy: 'uid-123',
  createdAt: '2026-04-19T00:00:00.000Z',
  updatedAt: '2026-04-19T00:00:00.000Z',
};

describe('ServiceSchema', () => {
  it('parses a valid service', () => {
    expect(() => ServiceSchema.parse(validService)).not.toThrow();
  });

  it('rejects basePrice below 0', () => {
    expect(() => ServiceSchema.parse({ ...validService, basePrice: -1 })).toThrow();
  });

  it('rejects commissionBps below 1500', () => {
    expect(() => ServiceSchema.parse({ ...validService, commissionBps: 1000 })).toThrow();
  });

  it('rejects commissionBps above 3500', () => {
    expect(() => ServiceSchema.parse({ ...validService, commissionBps: 4000 })).toThrow();
  });
});

describe('ServiceDetailSchema', () => {
  it('strips commissionBps, updatedBy, createdAt, updatedAt', () => {
    const detail = ServiceDetailSchema.parse(validService);
    expect(detail).not.toHaveProperty('commissionBps');
    expect(detail).not.toHaveProperty('updatedBy');
  });
});

describe('ServiceCardSchema', () => {
  it('only has card fields', () => {
    const card = ServiceCardSchema.parse(validService);
    expect(card).not.toHaveProperty('includes');
    expect(card).not.toHaveProperty('addOns');
    expect(card).toHaveProperty('basePrice');
  });
});
