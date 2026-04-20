import { getCosmosClient, DB_NAME } from './client.js';
import { AuditLogEntrySchema } from '../schemas/audit-log.js';
import type { AuditLogDoc, AuditLogEntry, AuditLogQuery } from '../schemas/audit-log.js';

const CONTAINER = 'audit_log';

export async function appendAuditEntry(entry: AuditLogDoc): Promise<void> {
  await getCosmosClient().database(DB_NAME).container(CONTAINER).items.create(entry);
}

export async function queryAuditLog(
  params: AuditLogQuery,
): Promise<{ entries: AuditLogEntry[]; continuationToken?: string }> {
  const conditions: string[] = [];
  const parameters: { name: string; value: unknown }[] = [];

  if (params.adminId !== undefined) {
    conditions.push('c.adminId = @adminId');
    parameters.push({ name: '@adminId', value: params.adminId });
  }
  if (params.action !== undefined) {
    conditions.push('c.action = @action');
    parameters.push({ name: '@action', value: params.action });
  }
  if (params.resourceType !== undefined) {
    conditions.push('c.resourceType = @resourceType');
    parameters.push({ name: '@resourceType', value: params.resourceType });
  }
  if (params.resourceId !== undefined) {
    conditions.push('c.resourceId = @resourceId');
    parameters.push({ name: '@resourceId', value: params.resourceId });
  }
  if (params.dateFrom !== undefined) {
    conditions.push('c.timestamp >= @dateFrom');
    parameters.push({ name: '@dateFrom', value: params.dateFrom });
  }
  if (params.dateTo !== undefined) {
    conditions.push('c.timestamp <= @dateTo');
    parameters.push({ name: '@dateTo', value: params.dateTo });
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT c.id, c.adminId, c.role, c.action, c.resourceType, c.resourceId, c.payload, c.ip, c.userAgent, c.timestamp FROM c ${where} ORDER BY c.timestamp DESC`;

  const iterator = getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(
      { query, parameters },
      {
        maxItemCount: params.pageSize,
        ...(params.continuationToken !== undefined && {
          continuationToken: params.continuationToken,
        }),
      },
    );

  const page = await iterator.fetchNext();
  const entries = page.resources.map((r) => AuditLogEntrySchema.parse(r));
  const result: { entries: AuditLogEntry[]; continuationToken?: string } = { entries };
  if (page.continuationToken !== undefined) {
    result.continuationToken = page.continuationToken;
  }
  return result;
}
