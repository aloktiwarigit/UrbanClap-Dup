import { getCosmosClient, DB_NAME } from './client.js';

const CONTAINER = 'technicians';

// ── Settlement helpers (E06-S04) ──────────────────────────────────────────────

export interface TechnicianSettlementInfo {
  id: string;
  completedJobCount: number;
  razorpayLinkedAccountId?: string;
}

export async function getTechnicianForSettlement(
  technicianId: string,
): Promise<TechnicianSettlementInfo | null> {
  const client = getCosmosClient();
  const { resource } = await client
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<TechnicianSettlementInfo>();
  return resource ?? null;
}

export async function incrementCompletedJobCount(technicianId: string): Promise<void> {
  const container = getCosmosClient().database(DB_NAME).container(CONTAINER);
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { resource, etag } = await container
      .item(technicianId, technicianId)
      .read<{ id: string; completedJobCount?: number } & Record<string, unknown>>();
    if (!resource) return;
    try {
      await container.item(technicianId, technicianId).replace(
        { ...resource, completedJobCount: (resource.completedJobCount ?? 0) + 1 },
        { accessCondition: { type: 'IfMatch', condition: etag ?? '' } },
      );
      return;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 412 && attempt < maxRetries - 1) {
        // ETag mismatch: concurrent write won — retry with fresh read
        continue;
      }
      throw err;
    }
  }
}
