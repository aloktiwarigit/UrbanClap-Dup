import { describe, it, expect } from 'vitest';
import {
  ServiceSchema,
  ServiceCardSchema,
  ServiceDetailSchema,
  UpdateServiceBodySchema,
} from '../../src/schemas/service.js';
import { ServiceCategorySchema } from '../../src/schemas/service-category.js';

const NOW = '2026-09-04T00:00:00.000Z';

const service = {
  id: 'ac-deep-clean',
  categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  nameHi: 'एसी डीप क्लीन',
  shortDescription: 'Chemical wash, gas check, filter clean.',
  shortDescriptionHi: 'केमिकल वॉश, गैस चेक, फिल्टर सफाई।',
  heroImageUrl: 'https://example.com/s.jpg',
  basePrice: 99900,
  durationMinutes: 90,
  includes: ['Chemical wash'],
  faq: [],
  addOns: [],
  photoStages: [],
  isActive: true,
  updatedBy: 'seed',
  createdAt: NOW,
  updatedAt: NOW,
};

describe('bilingual catalogue fields', () => {
  it('ServiceSchema accepts Hindi name and description', () => {
    expect(ServiceSchema.parse(service).nameHi).toBe('एसी डीप क्लीन');
  });

  it('Hindi fields are optional — existing documents still parse', () => {
    const { nameHi, shortDescriptionHi, ...withoutHindi } = service;
    expect(() => ServiceSchema.parse(withoutHindi)).not.toThrow();
  });

  // The catalogue HOME renders cards. ServiceCardSchema is a .pick(), so a field
  // added to ServiceSchema does NOT reach it automatically.
  it('ServiceCardSchema carries the Hindi fields', () => {
    const card = ServiceCardSchema.parse(service);
    expect(card.nameHi).toBe('एसी डीप क्लीन');
    expect(card.shortDescriptionHi).toBe('केमिकल वॉश, गैस चेक, फिल्टर सफाई।');
  });

  it('ServiceDetailSchema carries the Hindi fields', () => {
    expect(ServiceDetailSchema.parse(service).nameHi).toBe('एसी डीप क्लीन');
  });

  it('the update patch accepts a Hindi-only edit', () => {
    expect(UpdateServiceBodySchema.parse({ nameHi: 'नया नाम' })).toEqual({ nameHi: 'नया नाम' });
  });

  it('ServiceCategorySchema accepts a Hindi name and stays optional', () => {
    const category = {
      id: 'ac-repair',
      name: 'AC Repair',
      nameHi: 'एसी मरम्मत',
      heroImageUrl: 'https://example.com/c.jpg',
      sortOrder: 1,
      isActive: true,
      updatedBy: 'seed',
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(ServiceCategorySchema.parse(category).nameHi).toBe('एसी मरम्मत');
    const { nameHi, ...withoutHindi } = category;
    expect(() => ServiceCategorySchema.parse(withoutHindi)).not.toThrow();
  });

  it('rejects a blank Hindi string rather than storing an empty label', () => {
    expect(() => ServiceSchema.parse({ ...service, nameHi: '' })).toThrow();
  });
});
