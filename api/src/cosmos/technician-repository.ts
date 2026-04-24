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
  const { resource } = await container
    .item(technicianId, technicianId)
    .read<{ id: string; completedJobCount?: number } & Record<string, unknown>>();
  if (!resource) return;
  await container.item(technicianId, technicianId).replace({
    ...resource,
    completedJobCount: (resource.completedJobCount ?? 0) + 1,
  });
}
