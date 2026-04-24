import { getCosmosClient, DB_NAME } from './client.js';

const CONTAINER = 'audit_log';

export interface AuditEntryInput {
  id: string;
  adminId: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload?: Record<string, unknown>;
  details?: Record<string, unknown>;
  timestamp: string;
  partitionKey: string;
}

export async function appendAuditEntry(entry: AuditEntryInput): Promise<void> {
  await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.create(entry);
}
