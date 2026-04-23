import { randomUUID } from 'node:crypto';
import { getSscLeviesContainer } from './client.js';
import type { SscLevyDoc } from '../schemas/ssc-levy.js';

export const sscLevyRepo = {
  async createLevy(
    doc: Omit<SscLevyDoc, 'id' | 'createdAt'>,
  ): Promise<SscLevyDoc> {
    const full: SscLevyDoc = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...doc,
    };
    const { resource } = await getSscLeviesContainer().items.create<SscLevyDoc>(full);
    return resource!;
  },

  async getLevyByQuarter(quarter: string): Promise<SscLevyDoc | null> {
    const { resources } = await getSscLeviesContainer()
      .items.query<SscLevyDoc>({
        query: 'SELECT TOP 1 * FROM c WHERE c.quarter = @quarter',
        parameters: [{ name: '@quarter', value: quarter }],
      })
      .fetchAll();
    return resources[0] ?? null;
  },

  async getLevyById(id: string): Promise<SscLevyDoc | null> {
    const { resources } = await getSscLeviesContainer()
      .items.query<SscLevyDoc>({
        query: 'SELECT TOP 1 * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    return resources[0] ?? null;
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
