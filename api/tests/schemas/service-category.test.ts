import { describe, it, expect } from 'vitest';
import {
  ServiceCategorySchema,
  CreateCategoryBodySchema,
} from '../../src/schemas/service-category.js';

const validCategory = {
  id: 'ac-repair',
  name: 'AC Repair',
  heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/cat.jpg',
  sortOrder: 1,
  isActive: true,
  updatedBy: 'uid-123',
  createdAt: '2026-04-19T00:00:00.000Z',
  updatedAt: '2026-04-19T00:00:00.000Z',
};

describe('ServiceCategorySchema', () => {
  it('parses a valid category', () => {
    expect(() => ServiceCategorySchema.parse(validCategory)).not.toThrow();
  });

  it('rejects id with uppercase letters', () => {
    expect(() =>
      ServiceCategorySchema.parse({ ...validCategory, id: 'AC-Repair' })
    ).toThrow();
  });

  it('rejects non-URL heroImageUrl', () => {
    expect(() =>
      ServiceCategorySchema.parse({ ...validCategory, heroImageUrl: 'not-a-url' })
    ).toThrow();
  });

  it('accepts an optional commissionBps override in range', () => {
    expect(() =>
      ServiceCategorySchema.parse({ ...validCategory, commissionBps: 2000 })
    ).not.toThrow();
  });

  it('parses with commissionBps absent (falls through to global)', () => {
    expect(() => ServiceCategorySchema.parse(validCategory)).not.toThrow();
  });

  it('rejects commissionBps out of range', () => {
    expect(() =>
      ServiceCategorySchema.parse({ ...validCategory, commissionBps: 100 })
    ).toThrow();
  });
});

describe('CreateCategoryBodySchema', () => {
  it('does not require isActive, updatedBy, createdAt, updatedAt', () => {
    const { isActive: _isActive, updatedBy: _updatedBy, createdAt: _createdAt, updatedAt: _updatedAt, ...body } = validCategory;
    expect(() => CreateCategoryBodySchema.parse(body)).not.toThrow();
  });

  it('rejects if isActive is present (it is omitted)', () => {
    // The body schema is wrapped in a superRefine (price-in-prose guard), so it has no
    // `.shape`; assert the behaviour instead — the strict object rejects the extra key.
    const body = { id: 'ac-repair', name: 'AC Repair', heroImageUrl: 'https://example.com/c.jpg', sortOrder: 1 };
    expect(() => CreateCategoryBodySchema.parse({ ...body, isActive: true })).toThrow();
  });
});
