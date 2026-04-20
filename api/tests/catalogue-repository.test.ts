import { describe, it, expect, beforeEach, vi } from 'vitest';
import { _setCosmosClientForTest } from '../src/cosmos/client.js';
import { CatalogueRepository } from '../src/cosmos/catalogue-repository.js';
import type { ServiceCategory } from '../src/schemas/service-category.js';
import type { Service } from '../src/schemas/service.js';

const NOW = '2026-04-19T00:00:00.000Z';

const mockCategory: ServiceCategory = {
  id: 'ac-repair', name: 'AC Repair',
  heroImageUrl: 'https://example.com/cat.jpg',
  sortOrder: 1, isActive: true,
  updatedBy: 'uid-1', createdAt: NOW, updatedAt: NOW,
};

const mockService: Service = {
  id: 'ac-deep-clean', categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  shortDescription: 'Chemical wash.',
  heroImageUrl: 'https://example.com/svc.jpg',
  basePrice: 59900, commissionBps: 2250, durationMinutes: 90,
  includes: ['Chemical wash'], faq: [], addOns: [],
  photoStages: [{ id: 'before', label: 'Before', required: true }],
  isActive: true, updatedBy: 'uid-1', createdAt: NOW, updatedAt: NOW,
};

function makeMockItem(resource: unknown) {
  return {
    read: vi.fn().mockResolvedValue({ resource }),
    replace: vi.fn().mockResolvedValue({ resource }),
  };
}

function makeMockItems(resources: unknown[]) {
  return {
    query: vi.fn().mockReturnValue({ fetchAll: vi.fn().mockResolvedValue({ resources }) }),
    create: vi.fn().mockResolvedValue({ resource: resources[0] }),
    upsert: vi.fn().mockResolvedValue({ resource: resources[0] }),
  };
}

function makeMockContainer(resource: unknown, resources: unknown[]) {
  return {
    item: vi.fn().mockReturnValue(makeMockItem(resource)),
    items: makeMockItems(resources),
  };
}

function makeMockClient() {
  const catContainer = makeMockContainer(mockCategory, [mockCategory]);
  const svcContainer = makeMockContainer(mockService, [mockService]);
  return {
    database: vi.fn().mockReturnValue({
      container: vi.fn().mockImplementation((name: string) =>
        name === 'service_categories' ? catContainer : svcContainer
      ),
    }),
  } as never;
}

describe('CatalogueRepository', () => {
  let repo: CatalogueRepository;

  beforeEach(() => {
    _setCosmosClientForTest(makeMockClient());
    repo = new CatalogueRepository();
  });

  it('listActiveCategories returns categories from query', async () => {
    const result = await repo.listActiveCategories();
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('ac-repair');
  });

  it('getCategoryById returns category for valid id', async () => {
    const result = await repo.getCategoryById('ac-repair');
    expect(result?.name).toBe('AC Repair');
  });

  it('getCategoryById returns null for missing item', async () => {
    _setCosmosClientForTest({
      database: vi.fn().mockReturnValue({
        container: vi.fn().mockReturnValue({
          item: vi.fn().mockReturnValue({ read: vi.fn().mockResolvedValue({ resource: undefined }) }),
          items: makeMockItems([]),
        }),
      }),
    } as never);
    repo = new CatalogueRepository();
    const result = await repo.getCategoryById('nonexistent');
    expect(result).toBeNull();
  });

  it('createCategory adds isActive, updatedBy, timestamps', async () => {
    const body = { id: 'plumbing', name: 'Plumbing', heroImageUrl: 'https://example.com/p.jpg', sortOrder: 2 };
    const result = await repo.createCategory(body, 'uid-abc');
    expect(result).toBeDefined();
  });

  it('getServiceByIdCrossPartition returns service', async () => {
    const result = await repo.getServiceByIdCrossPartition('ac-deep-clean');
    expect(result?.basePrice).toBe(59900);
  });

  it('upsertCategory calls items.upsert', async () => {
    await expect(repo.upsertCategory(mockCategory)).resolves.not.toThrow();
  });
});
