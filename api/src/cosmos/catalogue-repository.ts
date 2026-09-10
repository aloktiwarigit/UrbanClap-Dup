import { getCatalogueContainers } from './client.js';
import type { ServiceCategory, CreateCategoryBody, UpdateCategoryBody } from '../schemas/service-category.js';
import type { Service, CreateServiceBody, UpdateServiceBody } from '../schemas/service.js';

function now(): string {
  return new Date().toISOString();
}

/**
 * P0-3: drop keys whose value is `undefined` before merging a patch body over a
 * stored document. Zod's `.partial()` omits absent keys rather than setting them to
 * `undefined`, so this is belt-and-braces — but a body assembled dynamically by a
 * future caller could carry explicit `undefined`, and a blind spread would then
 * overwrite stored content with nothing. That is exactly the failure mode this
 * story exists to remove.
 */
type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

function definedOnly<T extends object>(patch: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Defined<T>;
}

export class CatalogueRepository {
  private get cats() { return getCatalogueContainers().categories; }
  private get svcs() { return getCatalogueContainers().services; }

  // ── Categories ──────────────────────────────────────────────────────────────

  async listActiveCategories(): Promise<ServiceCategory[]> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>('SELECT * FROM c WHERE c.isActive = true ORDER BY c.sortOrder ASC')
      .fetchAll();
    return resources;
  }

  async listAllCategories(): Promise<ServiceCategory[]> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>('SELECT * FROM c ORDER BY c.sortOrder ASC')
      .fetchAll();
    return resources;
  }

  async getCategoryById(id: string): Promise<ServiceCategory | null> {
    const { resources } = await this.cats.items
      .query<ServiceCategory>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    return resources[0] ?? null;
  }

  async createCategory(body: CreateCategoryBody, uid: string): Promise<ServiceCategory> {
    const doc: ServiceCategory = { ...body, isActive: true, updatedBy: uid, createdAt: now(), updatedAt: now() };
    const { resource } = await this.cats.items.create<ServiceCategory>(doc);
    return resource!;
  }

  async updateCategory(id: string, body: UpdateCategoryBody, uid: string): Promise<ServiceCategory | null> {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    // `commissionBps` is handled separately from `definedOnly` below: on this one field, the
    // write body accepts `null` to mean "clear the override" (E21-S03 task 9 — see the doc
    // comment on `UpdateCategoryBodySchema`). `definedOnly` only ever strips `undefined`, so a
    // blind spread of the full body would write a literal `commissionBps: null` into the stored
    // document — a shape `ServiceCategorySchema` (still plain `.optional()`) does not accept, and
    // which would stop meaning "inherit the global default" the way an absent key does. Pulling
    // it out here keeps `definedOnly` itself untouched for every other field this repository (and
    // `updateService` below) merges.
    const { commissionBps, ...rest } = body;
    const updated: ServiceCategory = { ...existing, ...definedOnly(rest), id, updatedBy: uid, updatedAt: now() };
    if (commissionBps === null) {
      delete updated.commissionBps;
    } else if (commissionBps !== undefined) {
      updated.commissionBps = commissionBps;
    }
    const { resource } = await this.cats.items.upsert<ServiceCategory>(updated);
    return resource!;
  }

  async toggleCategory(id: string, uid: string): Promise<ServiceCategory | null> {
    const existing = await this.getCategoryById(id);
    if (!existing) return null;
    const updated = { ...existing, isActive: !existing.isActive, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.cats.items.upsert<ServiceCategory>(updated);
    return resource!;
  }

  async upsertCategory(doc: ServiceCategory): Promise<void> {
    await this.cats.items.upsert(doc);
  }

  // ── Services ─────────────────────────────────────────────────────────────────

  async listAllActiveServices(): Promise<Service[]> {
    const { resources } = await this.svcs.items
      .query<Service>('SELECT * FROM c WHERE c.isActive = true')
      .fetchAll();
    return resources;
  }

  async listServicesByCategory(categoryId: string, activeOnly = false): Promise<Service[]> {
    const q = activeOnly
      ? { query: 'SELECT * FROM c WHERE c.categoryId = @cid AND c.isActive = true', parameters: [{ name: '@cid', value: categoryId }] }
      : { query: 'SELECT * FROM c WHERE c.categoryId = @cid', parameters: [{ name: '@cid', value: categoryId }] };
    const { resources } = await this.svcs.items.query<Service>(q).fetchAll();
    return resources;
  }

  async getServiceByIdCrossPartition(id: string): Promise<Service | null> {
    const { resources } = await this.svcs.items
      .query<Service>({ query: 'SELECT * FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: id }] })
      .fetchAll();
    return resources[0] ?? null;
  }

  async createService(body: CreateServiceBody, uid: string): Promise<Service> {
    const doc: Service = { ...body, isActive: true, updatedBy: uid, createdAt: now(), updatedAt: now() };
    const { resource } = await this.svcs.items.create<Service>(doc);
    return resource!;
  }

  async updateService(id: string, body: UpdateServiceBody, uid: string): Promise<Service | null> {
    const existing = await this.getServiceByIdCrossPartition(id);
    if (!existing) return null;
    // Issue #334: same commissionBps null-means-clear handling as updateCategory above
    // (see that method's doc comment for the full rationale) -- definedOnly only ever
    // strips undefined, never null, so it's pulled out and applied separately.
    const { commissionBps, ...rest } = body;
    const updated: Service = { ...existing, ...definedOnly(rest), id, categoryId: existing.categoryId, updatedBy: uid, updatedAt: now() };
    if (commissionBps === null) {
      delete updated.commissionBps;
    } else if (commissionBps !== undefined) {
      updated.commissionBps = commissionBps;
    }
    const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
    return resource!;
  }

  async toggleService(id: string, uid: string): Promise<Service | null> {
    const existing = await this.getServiceByIdCrossPartition(id);
    if (!existing) return null;
    const updated = { ...existing, isActive: !existing.isActive, updatedBy: uid, updatedAt: now() };
    const { resource } = await this.svcs.item(id, existing.categoryId).replace<Service>(updated);
    return resource!;
  }

  async upsertService(doc: Service): Promise<void> {
    await this.svcs.items.upsert(doc);
  }
}

export const catalogueRepo = new CatalogueRepository();
