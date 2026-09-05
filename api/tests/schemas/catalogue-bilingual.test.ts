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
    const { nameHi: _n, shortDescriptionHi: _d, ...withoutHindi } = service;
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
    const { nameHi: _n, ...withoutHindi } = category;
    expect(() => ServiceCategorySchema.parse(withoutHindi)).not.toThrow();
  });

  it('rejects a blank Hindi string rather than storing an empty label', () => {
    expect(() => ServiceSchema.parse({ ...service, nameHi: '' })).toThrow();
  });

  // Codex finding: the admin form writes through this schema, so an owner can
  // reintroduce the stale-price defect the story removes unless prose fields
  // reject a price literal outright.
  it('ServiceSchema rejects a Hindi description that embeds a price', () => {
    expect(() =>
      ServiceSchema.parse({ ...service, shortDescriptionHi: 'सब कुछ ₹599 में' }),
    ).toThrow();
  });

  it('ServiceSchema rejects an English description that embeds a price', () => {
    expect(() =>
      ServiceSchema.parse({ ...service, shortDescription: 'All for Rs. 599' }),
    ).toThrow();
  });

  it('UpdateServiceBodySchema rejects a Hindi-only price-in-prose edit', () => {
    expect(() => UpdateServiceBodySchema.parse({ shortDescriptionHi: '₹699' })).toThrow();
  });

  it('ServiceCategorySchema rejects a Hindi name that embeds a price', () => {
    const category = {
      id: 'ac-repair',
      name: 'AC Repair',
      nameHi: 'एसी ₹',
      heroImageUrl: 'https://example.com/c.jpg',
      sortOrder: 1,
      isActive: true,
      updatedBy: 'seed',
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(() => ServiceCategorySchema.parse(category)).toThrow();
  });

  it('a clean Hindi description with no price still parses', () => {
    expect(ServiceSchema.parse({ ...service, shortDescriptionHi: 'सब कुछ शामिल है' }).shortDescriptionHi).toBe(
      'सब कुछ शामिल है',
    );
  });
});

describe('E22-S01 — price text is rejected everywhere it could be shown', () => {
  it('rejects shortDescriptionHi with रुपये', () => {
    expect(() =>
      ServiceSchema.parse({ ...service, shortDescriptionHi: 'सिर्फ 599 रुपये में' }),
    ).toThrow();
  });

  it('rejects shortDescriptionHi with रु.', () => {
    expect(() =>
      ServiceSchema.parse({ ...service, shortDescriptionHi: '599 रु. में' }),
    ).toThrow();
  });

  it('rejects includes array with ₹', () => {
    expect(() =>
      ServiceSchema.parse({ ...service, includes: ['Gas top-up ₹250'] }),
    ).toThrow();
  });

  it('rejects faq with price in answer', () => {
    expect(() =>
      ServiceSchema.parse({
        ...service,
        faq: [{ question: 'Extra?', answer: 'Yes — Rs 250 per metre' }],
      }),
    ).toThrow();
  });

  it('rejects addOns with price in name', () => {
    expect(() =>
      ServiceSchema.parse({
        ...service,
        addOns: [{ id: 'x', name: 'Pipe (₹250/m)', price: 25000, triggerCondition: 'per metre' }],
      }),
    ).toThrow();
  });

  it('rejects photoStages with price in label', () => {
    expect(() =>
      ServiceSchema.parse({
        ...service,
        photoStages: [{ id: 'p', label: 'Bill showing INR 599', required: true }],
      }),
    ).toThrow();
  });

  it('parses a service with clean nested prose', () => {
    const clean = {
      ...service,
      includes: ['Chemical wash', 'Gas refill'],
      faq: [{ question: 'How long?', answer: '2 hours max' }],
      addOns: [{ id: 'x', name: 'Extra service', price: 25000, triggerCondition: 'per metre' }],
      photoStages: [{ id: 'p', label: 'Final bill', required: true }],
    };
    expect(ServiceSchema.parse(clean)).toBeDefined();
  });
});
