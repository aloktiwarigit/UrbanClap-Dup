import { randomUUID, createHash } from 'node:crypto';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import type { AdminRole } from '../types/admin.js';

export interface AdminSession {
  id: string;
  sessionId: string;
  adminId: string;
  role: AdminRole;
  lastActivityAt: string;
  hardExpiresAt: string;
  refreshTokenHash: string;
}

export interface AdminSessionWithRawToken extends AdminSession {
  /** Raw refresh token — returned to caller once; never stored in Cosmos. */
  rawRefreshToken: string;
}

const CONTAINER = 'admin_sessions';
const INACTIVITY_MS = 30 * 60 * 1000;
const HARD_EXPIRY_MS = 8 * 60 * 60 * 1000;

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function createAdminSession(args: {
  adminId: string;
  role: AdminRole;
}): Promise<AdminSessionWithRawToken> {
  const sessionId = randomUUID();
  const rawRefreshToken = randomUUID();
  const now = new Date();
  const sessionDoc: AdminSession = {
    id: sessionId,
    sessionId,
    adminId: args.adminId,
    role: args.role,
    lastActivityAt: now.toISOString(),
    hardExpiresAt: new Date(now.getTime() + HARD_EXPIRY_MS).toISOString(),
    refreshTokenHash: sha256(rawRefreshToken),
  };
  await container().items.create(sessionDoc);
  return { ...sessionDoc, rawRefreshToken };
}

/**
 * Validate the raw refresh token against the stored hash and rotate it.
 * Returns the new raw refresh token on success, or null on any failure.
 *
 * Uses ETag-conditional replace to guard against concurrent rotation races.
 */
export async function validateAndRotateRefresh(
  sessionId: string,
  rawToken: string,
): Promise<string | null> {
  const { resource, etag } = await container()
    .item(sessionId, sessionId)
    .read<AdminSession>();

  if (!resource) return null;

  const now = new Date();
  if (new Date(resource.hardExpiresAt) <= now) return null;
  if (now.getTime() - new Date(resource.lastActivityAt).getTime() > INACTIVITY_MS) return null;

  // Constant-time hash comparison via SHA-256 (avoids timing oracle on raw token)
  if (sha256(rawToken) !== resource.refreshTokenHash) return null;

  const newRawToken = randomUUID();
  const updated: AdminSession = {
    ...resource,
    refreshTokenHash: sha256(newRawToken),
    lastActivityAt: now.toISOString(),
  };

  await container()
    .item(sessionId, sessionId)
    .replace(updated, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });

  return newRawToken;
}

export async function touchAndGetSession(
  sessionId: string,
): Promise<AdminSession | null> {
  const { resource } = await container()
    .item(sessionId, sessionId)
    .read<AdminSession>();
  if (!resource) return null;

  const now = new Date();
  if (new Date(resource.hardExpiresAt) <= now) return null;
  if (now.getTime() - new Date(resource.lastActivityAt).getTime() > INACTIVITY_MS)
    return null;

  await container()
    .item(sessionId, sessionId)
    .replace({ ...resource, lastActivityAt: now.toISOString() });

  return resource;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await container().item(sessionId, sessionId).delete();
}

/** Revoke all active sessions for an admin — called when role or deactivatedAt changes. */
export async function deleteAllSessionsForAdmin(adminId: string): Promise<void> {
  const { resources } = await container()
    .items.query<AdminSession>({
      query: 'SELECT c.id FROM c WHERE c.adminId = @adminId',
      parameters: [{ name: '@adminId', value: adminId }],
    })
    .fetchAll();
  await Promise.all(resources.map((s) => container().item(s.id, s.id).delete()));
}
