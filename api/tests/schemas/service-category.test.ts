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
});

describe('CreateCategoryBodySchema', () => {
  it('does not require isActive, updatedBy, createdAt, updatedAt', () => {
    const { isActive: _isActive, updatedBy: _updatedBy, createdAt: _createdAt, updatedAt: _updatedAt, ...body } = validCategory;
    expect(() => CreateCategoryBodySchema.parse(body)).not.toThrow();
  });

  it('rejects if isActive is present (it is omitted)', () => {
    expect(CreateCategoryBodySchema.shape).not.toHaveProperty('isActive');
  });
});
