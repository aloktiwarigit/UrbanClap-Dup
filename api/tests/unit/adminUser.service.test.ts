import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import {
  claimAdminInvite,
  getAdminUserById,
  getAdminInviteId,
  getAdminUserByEmail,
  createAdminUser,
  isAdminInvite,
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

  describe('getAdminUserByEmail', () => {
    it('normalizes email before querying', async () => {
      const fetchAll = vi.fn().mockResolvedValue({ resources: [{ adminId: 'u1' }] });
      const query = vi.fn().mockReturnValue({ fetchAll });
      container.items.query = query;

      await getAdminUserByEmail('  Admin@Test.COM ');

      expect(query).toHaveBeenCalledWith(expect.objectContaining({
        parameters: [{ name: '@email', value: 'admin@test.com' }],
      }));
    });
  });

  describe('admin invite helpers', () => {
    it('builds stable invite ids from normalized email', () => {
      expect(getAdminInviteId('  AnshuTiwari183@GMAIL.com ')).toBe(
        'invite:anshutiwari183@gmail.com',
      );
    });

    it('detects invite records', () => {
      expect(isAdminInvite({ adminId: 'invite:a@b.com' } as any)).toBe(true);
      expect(isAdminInvite({ adminId: 'firebase-uid' } as any)).toBe(false);
    });

    it('creates a Firebase UID record and deletes the pending invite', async () => {
      container.items.create = vi.fn().mockResolvedValue({});
      const deleteInvite = vi.fn().mockResolvedValue({});
      container.item.mockReturnValue({ delete: deleteInvite });
      const invite = {
        id: 'invite:anshutiwari183@gmail.com',
        adminId: 'invite:anshutiwari183@gmail.com',
        email: 'anshutiwari183@gmail.com',
        role: 'super-admin' as const,
        totpEnrolled: false,
        totpSecret: null,
        totpSecretPending: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        deactivatedAt: null,
      };

      const claimed = await claimAdminInvite(invite, 'firebase-uid', 'AnshuTiwari183@GMAIL.com');

      expect(claimed).toEqual(expect.objectContaining({
        id: 'firebase-uid',
        adminId: 'firebase-uid',
        email: 'anshutiwari183@gmail.com',
        role: 'super-admin',
        totpEnrolled: false,
        totpSecret: null,
        totpSecretPending: null,
        deactivatedAt: null,
      }));
      expect(container.items.create).toHaveBeenCalledWith(claimed);
      expect(container.item).toHaveBeenCalledWith(invite.id, invite.adminId);
      expect(deleteInvite).toHaveBeenCalled();
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
