import { describe, it, expect } from 'vitest';
import {
  ServiceSchema,
  ServiceCardSchema,
  ServiceDetailSchema,
  CreateServiceBodySchema,
  UpdateServiceBodySchema,
} from '../../src/schemas/service.js';
import {
  ServiceCategorySchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
} from '../../src/schemas/service-category.js';

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

  it('a clean Hindi description with no price still parses', () => {
    expect(ServiceSchema.parse({ ...service, shortDescriptionHi: 'सब कुछ शामिल है' }).shortDescriptionHi).toBe(
      'सब कुछ शामिल है',
    );
  });
});

// The create body is the stored shape minus the server-owned bookkeeping fields.
const { isActive: _a, updatedBy: _u, createdAt: _c, updatedAt: _t, ...createBody } = service;

// HOTFIX 2026-09-05: the price-in-prose rule lives on the WRITE bodies only. Enforcing it on
// ServiceSchema / ServiceCardSchema took GET /v1/categories down in production, because
// documents seeded before the reprice still carried "₹599" in prose and every card parse threw.
describe('read path tolerates legacy documents that still carry a price in prose', () => {
  const legacy = {
    ...service,
    shortDescription: 'Chemical wash, gas check, filter clean — everything included for ₹599.',
    shortDescriptionHi: 'केमिकल वॉश, गैस चेक, फिल्टर सफाई — पूरी तरह से ₹599 में।',
    faq: [{ question: 'Is copper pipe beyond 3m extra?', answer: 'Yes — ₹250/m beyond 3 m.' }],
  };

  it('ServiceSchema parses a pre-reprice document', () => {
    expect(() => ServiceSchema.parse(legacy)).not.toThrow();
  });

  it('ServiceCardSchema (catalogue home) parses a pre-reprice document', () => {
    expect(ServiceCardSchema.parse(legacy).basePrice).toBe(99900);
  });

  it('ServiceDetailSchema (service page) parses a pre-reprice document', () => {
    expect(() => ServiceDetailSchema.parse(legacy)).not.toThrow();
  });

  it('ServiceCategorySchema parses a legacy category whose name carries a price', () => {
    const category = {
      id: 'ac-repair',
      name: 'AC Repair from ₹599',
      heroImageUrl: 'https://example.com/c.jpg',
      sortOrder: 1,
      isActive: true,
      updatedBy: 'seed',
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(() => ServiceCategorySchema.parse(category)).not.toThrow();
  });
});

// Codex finding: the admin form writes through these bodies, so an owner could
// reintroduce the stale-price defect the story removes unless every prose field
// rejects a price literal outright.
describe('E22-S01 — write bodies reject price text everywhere it could be shown', () => {
  it.each([
    ['shortDescriptionHi with ₹', { shortDescriptionHi: 'सब कुछ ₹599 में' }],
    ['shortDescription with Rs.', { shortDescription: 'All for Rs. 599' }],
    ['shortDescriptionHi with रुपये', { shortDescriptionHi: 'सिर्फ 599 रुपये में' }],
    ['shortDescriptionHi with रु.', { shortDescriptionHi: '599 रु. में' }],
    ['name with INR', { name: 'AC Clean INR 599' }],
    ['nameHi with ₹', { nameHi: 'एसी ₹' }],
    ['includes with ₹', { includes: ['Gas top-up ₹250'] }],
    ['faq answer with Rs', { faq: [{ question: 'Extra?', answer: 'Yes — Rs 250 per metre' }] }],
    ['addOns name with ₹', { addOns: [{ id: 'x', name: 'Pipe (₹250/m)', price: 25000, triggerCondition: 'per metre' }] }],
    ['addOns triggerCondition with ₹', { addOns: [{ id: 'x', name: 'Pipe', price: 25000, triggerCondition: '₹250 per metre' }] }],
    ['photoStages label with INR', { photoStages: [{ id: 'p', label: 'Bill showing INR 599', required: true }] }],
  ])('CreateServiceBodySchema rejects %s', (_label, patch) => {
    expect(() => CreateServiceBodySchema.parse({ ...createBody, ...patch })).toThrow();
  });

  it('CreateServiceBodySchema reports the offending field path', () => {
    const result = CreateServiceBodySchema.safeParse({
      ...createBody,
      faq: [{ question: 'Extra?', answer: 'Yes — ₹250/m' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['faq', 0, 'answer']);
    }
  });

  it('UpdateServiceBodySchema rejects a Hindi-only price-in-prose patch', () => {
    expect(() => UpdateServiceBodySchema.parse({ shortDescriptionHi: '₹699' })).toThrow();
  });

  it('UpdateServiceBodySchema rejects a nested price in a partial patch', () => {
    expect(() => UpdateServiceBodySchema.parse({ includes: ['Copper pipe ₹250/m'] })).toThrow();
  });

  it('UpdateServiceBodySchema still accepts a clean partial patch', () => {
    expect(UpdateServiceBodySchema.parse({ basePrice: 99900 })).toEqual({ basePrice: 99900 });
  });

  it('CreateCategoryBodySchema rejects a Hindi name that embeds a price', () => {
    expect(() =>
      CreateCategoryBodySchema.parse({ id: 'ac-repair', name: 'AC Repair', nameHi: 'एसी ₹', heroImageUrl: 'https://example.com/c.jpg', sortOrder: 1 }),
    ).toThrow();
  });

  it('UpdateCategoryBodySchema rejects a name that embeds a price and accepts a clean one', () => {
    expect(() => UpdateCategoryBodySchema.parse({ name: 'AC Repair Rs 599' })).toThrow();
    expect(UpdateCategoryBodySchema.parse({ nameHi: 'एसी मरम्मत' })).toEqual({ nameHi: 'एसी मरम्मत' });
  });

  it('CreateServiceBodySchema accepts a service with clean nested prose', () => {
    const clean = {
      ...createBody,
      includes: ['Chemical wash', 'Gas refill'],
      faq: [{ question: 'How long?', answer: '2 hours max' }],
      addOns: [{ id: 'x', name: 'Extra service', price: 25000, triggerCondition: 'per metre' }],
      photoStages: [{ id: 'p', label: 'Final bill', required: true }],
    };
    expect(CreateServiceBodySchema.parse(clean)).toBeDefined();
  });
});
