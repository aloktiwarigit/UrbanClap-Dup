// P0-3 — Catalogue update must never destroy service content.
//
// The bug: `UpdateServiceBodySchema` was `ServiceSchema.omit({...})` with no
// `.partial()`, so `includes`, `faq`, `addOns` and `photoStages` were REQUIRED on
// every update. The admin form satisfied that contract by sending `[]` for all four,
// and `updateService` merged them in with a blind spread — so saving a price change
// wiped the add-ons, FAQ, "includes" bullets and photoStages.
//
// photoStages drives the technician guided-photo flow (E06-S02), so the evidence
// chain for a completed job disappeared silently while commission was still charged.
//
// These tests pin the contract at BOTH layers: the schema must accept a partial
// body, and the repository must merge without clobbering absent fields.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { _setCosmosClientForTest } from '../src/cosmos/client.js';
import { CatalogueRepository } from '../src/cosmos/catalogue-repository.js';
import { UpdateServiceBodySchema } from '../src/schemas/service.js';
import { UpdateCategoryBodySchema } from '../src/schemas/service-category.js';
import type { ServiceCategory } from '../src/schemas/service-category.js';
import type { Service } from '../src/schemas/service.js';

const NOW = '2026-04-19T00:00:00.000Z';

const richService: Service = {
  id: 'ac-deep-clean',
  categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  shortDescription: 'Chemical wash, gas check, filter clean.',
  heroImageUrl: 'https://example.com/svc.jpg',
  basePrice: 59900,
  commissionBps: 2250,
  durationMinutes: 90,
  includes: ['Chemical wash', 'Gas pressure check', 'Filter clean'],
  faq: [{ question: 'How long?', answer: 'About 90 minutes.' }],
  addOns: [{ id: 'gas-refill', name: 'Gas Refill', price: 149900, triggerCondition: 'if pressure low' }],
  photoStages: [
    { id: 'before', label: 'Before', required: true },
    { id: 'after', label: 'After', required: true },
  ],
  isActive: true,
  updatedBy: 'uid-1',
  createdAt: NOW,
  updatedAt: NOW,
};

const richCategory: ServiceCategory = {
  id: 'ac-repair',
  name: 'AC Repair',
  heroImageUrl: 'https://example.com/cat.jpg',
  sortOrder: 1,
  isActive: true,
  updatedBy: 'uid-1',
  createdAt: NOW,
  updatedAt: NOW,
};

const replaceSpy = vi.fn();
const catUpsertSpy = vi.fn();

function makeMockClient() {
  const svcContainer = {
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: richService }),
      replace: replaceSpy.mockResolvedValue({ resource: richService }),
    }),
    items: {
      query: vi.fn().mockReturnValue({
        fetchAll: vi.fn().mockResolvedValue({ resources: [richService] }),
      }),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  };
  const catContainer = {
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: richCategory }),
      replace: vi.fn().mockResolvedValue({ resource: richCategory }),
    }),
    items: {
      query: vi.fn().mockReturnValue({
        fetchAll: vi.fn().mockResolvedValue({ resources: [richCategory] }),
      }),
      create: vi.fn(),
      upsert: catUpsertSpy.mockResolvedValue({ resource: richCategory }),
    },
  };
  return {
    database: vi.fn().mockReturnValue({
      container: vi.fn().mockImplementation((name: string) =>
        name === 'service_categories' ? catContainer : svcContainer,
      ),
    }),
  } as never;
}

describe('P0-3 — update body accepts a partial patch', () => {
  it('UpdateServiceBodySchema accepts a price-only edit', () => {
    const parsed = UpdateServiceBodySchema.parse({ basePrice: 99900 });
    expect(parsed).toEqual({ basePrice: 99900 });
  });

  it('UpdateServiceBodySchema does not inject empty arrays for absent content fields', () => {
    const parsed = UpdateServiceBodySchema.parse({ basePrice: 99900 }) as Record<string, unknown>;

    expect('includes' in parsed).toBe(false);
    expect('faq' in parsed).toBe(false);
    expect('addOns' in parsed).toBe(false);
    expect('photoStages' in parsed).toBe(false);
  });

  it('UpdateCategoryBodySchema accepts a name-only edit', () => {
    expect(UpdateCategoryBodySchema.parse({ name: 'AC Service' })).toEqual({ name: 'AC Service' });
  });

  it('still rejects unknown fields (schema stays strict)', () => {
    expect(() => UpdateServiceBodySchema.parse({ basePrice: 1, nope: true })).toThrow();
  });

  it('still validates the fields that ARE supplied', () => {
    expect(() => UpdateServiceBodySchema.parse({ basePrice: -5 })).toThrow();
    expect(() => UpdateServiceBodySchema.parse({ commissionBps: 9000 })).toThrow();
  });
});

describe('P0-3 — repository merge preserves untouched content', () => {
  let repo: CatalogueRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    _setCosmosClientForTest(makeMockClient());
    repo = new CatalogueRepository();
  });

  it('a price-only edit leaves includes / faq / addOns / photoStages byte-identical', async () => {
    await repo.updateService('ac-deep-clean', { basePrice: 99900 }, 'admin-1');

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    const written = replaceSpy.mock.calls[0]?.[0] as Service;

    expect(written.basePrice).toBe(99900);
    expect(written.includes).toEqual(richService.includes);
    expect(written.faq).toEqual(richService.faq);
    expect(written.addOns).toEqual(richService.addOns);
    expect(written.photoStages).toEqual(richService.photoStages);
    // Untouched scalars survive too.
    expect(written.name).toBe(richService.name);
    expect(written.durationMinutes).toBe(richService.durationMinutes);
    expect(written.commissionBps).toBe(richService.commissionBps);
  });

  it('an explicit content edit still replaces that field', async () => {
    const newAddOns = [{ id: 'deep', name: 'Deep', price: 100, triggerCondition: 'always' }];
    await repo.updateService('ac-deep-clean', { addOns: newAddOns }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect(written.addOns).toEqual(newAddOns);
    // and does not disturb its neighbours
    expect(written.photoStages).toEqual(richService.photoStages);
  });

  it('an explicit empty array is still honoured (clearing is a deliberate act)', async () => {
    await repo.updateService('ac-deep-clean', { addOns: [] }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect(written.addOns).toEqual([]);
    expect(written.includes).toEqual(richService.includes);
  });

  it('identity fields cannot be overwritten by the body', async () => {
    await repo.updateService('ac-deep-clean', { basePrice: 1 }, 'admin-1');

    const written = replaceSpy.mock.calls[0]?.[0] as Service;
    expect(written.id).toBe('ac-deep-clean');
    expect(written.categoryId).toBe('ac-repair');
    expect(written.updatedBy).toBe('admin-1');
  });

  it('a category name-only edit preserves heroImageUrl and sortOrder', async () => {
    await repo.updateCategory('ac-repair', { name: 'AC Service' }, 'admin-1');

    expect(catUpsertSpy).toHaveBeenCalledTimes(1);
    const written = catUpsertSpy.mock.calls[0]?.[0] as ServiceCategory;

    expect(written.name).toBe('AC Service');
    expect(written.heroImageUrl).toBe(richCategory.heroImageUrl);
    expect(written.sortOrder).toBe(richCategory.sortOrder);
  });
});
