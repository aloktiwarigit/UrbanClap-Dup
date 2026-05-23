/**
 * E12-S03 — Sub-task C: Signed/rotating hs_refresh cookie
 *
 * Verifies:
 * 1. createAdminSession returns a session with refreshTokenHash (SHA-256) and
 *    a rawRefreshToken (UUID, not stored but returned).
 * 2. validateAndRotateRefresh with the correct raw token returns a new token
 *    and updates the hash in Cosmos.
 * 3. validateAndRotateRefresh with a wrong token throws / returns null.
 * 4. validateAndRotateRefresh rejects when the session is expired or missing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// ── Cosmos mock ──────────────────────────────────────────────────────────────
const mockCreate = vi.fn();
const mockRead = vi.fn();
const mockReplace = vi.fn();
const mockItemFn = vi.fn(() => ({ read: mockRead, replace: mockReplace }));

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: () => ({
    database: () => ({
      container: () => ({
        items: { create: mockCreate, query: vi.fn(() => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) })) },
        item: mockItemFn,
      }),
    }),
  }),
  DB_NAME: 'homeservices',
}));

import {
  createAdminSession,
  validateAndRotateRefresh,
} from '../../src/services/adminSession.service.js';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAdminSession', () => {
  it('creates a session doc with refreshTokenHash and returns rawRefreshToken', async () => {
    mockCreate.mockResolvedValue({});

    const result = await createAdminSession({ adminId: 'admin-1', role: 'super-admin' });

    expect(result.rawRefreshToken).toBeTruthy();
    expect(typeof result.rawRefreshToken).toBe('string');
    expect(result.rawRefreshToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // The session doc passed to Cosmos should contain the hash, not the raw token
    const docArg = mockCreate.mock.calls[0]![0] as {
      refreshTokenHash: string;
      rawRefreshToken?: string;
    };
    expect(docArg.refreshTokenHash).toBe(sha256(result.rawRefreshToken));
    expect(docArg.rawRefreshToken).toBeUndefined();
  });

  it('fresh session has sessionId that differs from rawRefreshToken', async () => {
    mockCreate.mockResolvedValue({});

    const result = await createAdminSession({ adminId: 'admin-2', role: 'ops-manager' });

    expect(result.sessionId).not.toBe(result.rawRefreshToken);
  });
});

describe('validateAndRotateRefresh', () => {
  const sessionId = 'sess-rotate-1';
  const rawToken = 'initial-raw-uuid-value';
  const tokenHash = sha256(rawToken);
  const now = new Date();
  const futureHardExpiry = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
  const recentActivity = new Date(now.getTime() - 1000).toISOString(); // 1 second ago

  const baseSession = {
    id: sessionId,
    sessionId,
    adminId: 'admin-rotate',
    role: 'super-admin' as const,
    lastActivityAt: recentActivity,
    hardExpiresAt: futureHardExpiry,
    refreshTokenHash: tokenHash,
  };

  it('returns a new rawRefreshToken when the provided token is correct', async () => {
    mockRead.mockResolvedValue({ resource: baseSession, etag: '"etag-1"' });
    mockReplace.mockResolvedValue({});

    const result = await validateAndRotateRefresh(sessionId, rawToken);

    expect(result).toBeTruthy();
    expect(result).not.toBe(rawToken); // rotated
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('updates the hash in Cosmos with the new token hash on rotation', async () => {
    mockRead.mockResolvedValue({ resource: baseSession, etag: '"etag-2"' });
    mockReplace.mockResolvedValue({});

    const newToken = await validateAndRotateRefresh(sessionId, rawToken);

    const replaceArg = mockReplace.mock.calls[0]![0] as { refreshTokenHash: string };
    expect(replaceArg.refreshTokenHash).toBe(sha256(newToken!));
  });

  it('returns null when the provided raw token hash does not match', async () => {
    mockRead.mockResolvedValue({ resource: baseSession, etag: '"etag-3"' });

    const result = await validateAndRotateRefresh(sessionId, 'wrong-token-value');

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when session is not found in Cosmos', async () => {
    mockRead.mockResolvedValue({ resource: undefined, etag: undefined });

    const result = await validateAndRotateRefresh(sessionId, rawToken);

    expect(result).toBeNull();
  });

  it('returns null when session is past hard expiry', async () => {
    const expiredSession = {
      ...baseSession,
      hardExpiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    mockRead.mockResolvedValue({ resource: expiredSession, etag: '"etag-exp"' });

    const result = await validateAndRotateRefresh(sessionId, rawToken);

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('returns null when session is past inactivity timeout', async () => {
    const inactiveSession = {
      ...baseSession,
      lastActivityAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(), // 31 min ago
    };
    mockRead.mockResolvedValue({ resource: inactiveSession, etag: '"etag-inactive"' });

    const result = await validateAndRotateRefresh(sessionId, rawToken);

    expect(result).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
