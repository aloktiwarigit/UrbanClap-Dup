import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import {
  getAdminUserById,
  getAdminUserByEmail,
  updateAdminUser,
  createAdminUser,
} from '../../src/services/adminUser.service.js';
import { getCosmosClient } from '../../src/cosmos/client.js';

const makeContainer = (overrides: Record<string, unknown> = {}) => ({
  item: vi.fn(),
  items: { query: vi.fn(), create: vi.fn() },
  ...overrides,
});

describe('adminUser.service', () => {
  let container: ReturnType<typeof makeContainer>;

  beforeEach(() => {
    container = makeContainer();
    vi.mocked(getCosmosClient).mockReturnValue({
      database: () => ({ container: () => container }),
    } as any);
  });

  describe('getAdminUserById', () => {
    it('returns null when not found', async () => {
      container.item.mockReturnValue({ read: async () => ({ resource: undefined }) });
      expect(await getAdminUserById('x')).toBeNull();
    });

    it('returns the user when found', async () => {
      const user = { id: 'u1', adminId: 'u1', email: 'a@b.com', role: 'super-admin' };
      container.item.mockReturnValue({ read: async () => ({ resource: user }) });
      expect(await getAdminUserById('u1')).toEqual(user);
    });
  });

  describe('createAdminUser', () => {
    it('calls container.items.create with the user', async () => {
      container.items.create = vi.fn().mockResolvedValue({});
      const user = {
        id: 'u1', adminId: 'u1', email: 'a@b.com', role: 'super-admin' as const,
        totpEnrolled: false, totpSecret: null, totpSecretPending: null,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
        deactivatedAt: null,
      };
      await createAdminUser(user);
      expect(container.items.create).toHaveBeenCalledWith(user);
    });
  });
});
