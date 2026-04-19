import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import { randomUUID } from 'node:crypto';
import type { AdminRole, AuditAction } from '../types/admin.js';

export interface AuditEntry {
  adminId: string;
  role: AdminRole;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ip: string;
  reasonCode?: string;
  beforeStateHash?: string;
  afterStateHash?: string;
}

const CONTAINER = 'audit_log';

export async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  const timestamp = new Date().toISOString();
  const partitionKey = timestamp.slice(0, 7); // yyyy-mm
  await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.create({
      id: randomUUID(),
      partitionKey,
      timestamp,
      ...entry,
    });
}
