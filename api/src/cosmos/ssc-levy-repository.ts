import { getSscLeviesContainer } from './client.js';
import type { SscLevyDoc } from '../schemas/ssc-levy.js';

export const sscLevyRepo = {
  /**
   * Create a new levy document using the quarter string as the deterministic
   * Cosmos document id. This makes creation idempotent at the DB level: a
   * second `items.create()` for the same quarter returns a 409 Conflict,
   * preventing duplicate levy records even under at-least-once timer replay.
   */
  async createLevy(
    doc: Omit<SscLevyDoc, 'id' | 'createdAt'>,
  ): Promise<SscLevyDoc> {
    const full: SscLevyDoc = {
      id: doc.quarter,           // deterministic — quarter is unique per period
      createdAt: new Date().toISOString(),
      ...doc,
    };
    const { resource } = await getSscLeviesContainer().items.create<SscLevyDoc>(full);
    return resource!;
  },

  async getLevyByQuarter(quarter: string): Promise<SscLevyDoc | null> {
    // Point read: id === quarter === partition key — O(1) RU cost
    const { resource } = await getSscLeviesContainer()
      .item(quarter, quarter)
      .read<SscLevyDoc>();
    return resource ?? null;
  },

  async getLevyById(id: string): Promise<SscLevyDoc | null> {
    // id is the quarter string, so partition key === id
    const { resource } = await getSscLeviesContainer()
      .item(id, id)
      .read<SscLevyDoc>();
    return resource ?? null;
  },

  async updateLevy(
    id: string,
    quarter: string,
    fields: Partial<Omit<SscLevyDoc, 'id' | 'quarter' | 'createdAt'>>,
  ): Promise<SscLevyDoc | null> {
    const { resource: existing } = await getSscLeviesContainer()
      .item(id, quarter)
      .read<SscLevyDoc>();
    if (!existing) return null;
    const updated: SscLevyDoc = { ...existing, ...fields };
    const { resource } = await getSscLeviesContainer()
      .item(id, quarter)
      .replace<SscLevyDoc>(updated);
    return resource ?? null;
  },
};
