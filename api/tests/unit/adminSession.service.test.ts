import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import {
  createAdminSession,
  touchAndGetSession,
  deleteSession,
} from '../../src/services/adminSession.service.js';
import { getCosmosClient } from '../../src/cosmos/client.js';

function makeContainer() {
  return {
    item: vi.fn(),
    items: { create: vi.fn() },
  };
}

describe('adminSession.service', () => {
  let container: ReturnType<typeof makeContainer>;

  beforeEach(() => {
    container = makeContainer();
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: () => container }),
    } as any);
  });

  describe('createAdminSession', () => {
    it('creates a session and returns it with a sessionId', async () => {
      container.items.create = vi.fn().mockResolvedValue({});
      const session = await createAdminSession({ adminId: 'a1', role: 'super-admin' });
      expect(session.sessionId).toBeDefined();
      expect(session.role).toBe('super-admin');
      expect(container.items.create).toHaveBeenCalled();
    });
  });

  describe('touchAndGetSession', () => {
    it('returns null when session does not exist', async () => {
      container.item.mockReturnValue({ read: async () => ({ resource: undefined }) });
      expect(await touchAndGetSession('nonexistent')).toBeNull();
    });

    it('returns null when session has exceeded hard expiry', async () => {
      const past = new Date(Date.now() - 1000).toISOString();
      container.item.mockReturnValue({
        read: async () => ({
          resource: {
            sessionId: 's1', lastActivityAt: new Date().toISOString(),
            hardExpiresAt: past,
          },
        }),
        replace: vi.fn(),
      });
      expect(await touchAndGetSession('s1')).toBeNull();
    });

    it('returns null when inactive for more than 30 minutes', async () => {
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000).toISOString();
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      container.item.mockReturnValue({
        read: async () => ({
          resource: {
            sessionId: 's1', lastActivityAt: thirtyOneMinutesAgo,
            hardExpiresAt: future,
          },
        }),
        replace: vi.fn(),
      });
      expect(await touchAndGetSession('s1')).toBeNull();
    });

    it('returns session and updates lastActivityAt when valid', async () => {
      const recentActivity = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const session = { sessionId: 's1', lastActivityAt: recentActivity, hardExpiresAt: future };
      const replace = vi.fn().mockResolvedValue({});
      container.item.mockReturnValue({
        read: async () => ({ resource: session }),
        replace,
      });
      const result = await touchAndGetSession('s1');
      expect(result).toBeTruthy();
      expect(replace).toHaveBeenCalled();
    });
  });
});
