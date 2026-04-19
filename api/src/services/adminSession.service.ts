import { randomUUID } from 'node:crypto';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import type { AdminRole } from '../types/admin.js';

export interface AdminSession {
  id: string;
  sessionId: string;
  adminId: string;
  role: AdminRole;
  lastActivityAt: string;
  hardExpiresAt: string;
}

const CONTAINER = 'admin_sessions';
const INACTIVITY_MS = 30 * 60 * 1000;
const HARD_EXPIRY_MS = 8 * 60 * 60 * 1000;

function container() {
  return getCosmosClient().database(DB_NAME).container(CONTAINER);
}

export async function createAdminSession(args: {
  adminId: string;
  role: AdminRole;
}): Promise<AdminSession> {
  const sessionId = randomUUID();
  const now = new Date();
  const session: AdminSession = {
    id: sessionId,
    sessionId,
    adminId: args.adminId,
    role: args.role,
    lastActivityAt: now.toISOString(),
    hardExpiresAt: new Date(now.getTime() + HARD_EXPIRY_MS).toISOString(),
  };
  await container().items.create(session);
  return session;
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
