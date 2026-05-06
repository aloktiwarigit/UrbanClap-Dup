'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { patchAdminUser } from '@/api/adminUsers';
import { formatDate as intlFormatDate } from '@/lib/format/intl';
import type { AdminUserListItem } from '@/types/admin-user';
import type { AdminRole } from '@/lib/auth/types';

const ROLE_OPTIONS: AdminRole[] = ['super-admin', 'ops-manager', 'finance', 'support-agent'];

interface AdminUsersClientProps {
  initialUsers: AdminUserListItem[];
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const locale = useLocale();
  const [users, setUsers] = useState(initialUsers);
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map((user) => [user.adminId, user.displayName ?? ''])),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeCount = useMemo(
    () => users.filter((user) => user.deactivatedAt === null).length,
    [users],
  );

  async function updateUser(adminId: string, patch: Partial<AdminUserListItem>) {
    setPendingId(adminId);
    setToast(null);
    try {
      await patchAdminUser(adminId, {
        ...(patch.role !== undefined ? { role: patch.role } : {}),
        ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
        ...('deactivatedAt' in patch ? { deactivatedAt: patch.deactivatedAt ?? null } : {}),
      });
      setUsers((current) =>
        current.map((user) =>
          user.adminId === adminId
            ? { ...user, ...patch, updatedAt: new Date().toISOString() }
            : user,
        ),
      );
      setToast({ type: 'success', message: 'Admin user updated.' });
    } catch {
      setToast({ type: 'error', message: 'Admin user update failed.' });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-5)]">
      <div>
        <p className="eyebrow m-0 mb-[var(--space-1)]">Identity and access</p>
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          Admin Users
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-[var(--space-1)]">
          {activeCount} active of {users.length} admin accounts.
        </p>
      </div>

      {toast && (
        <p
          role="status"
          className={`text-sm rounded p-[var(--space-3)] ${
            toast.type === 'success'
              ? 'bg-green-50 text-[var(--color-success)]'
              : 'bg-red-50 text-[var(--color-danger)]'
          }`}
        >
          {toast.message}
        </p>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          No admin users returned by the API.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="pb-2 pr-4 font-medium">Admin</th>
                <th className="pb-2 pr-4 font-medium">Display Name</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">TOTP</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isPending = pendingId === user.adminId;
                const isActive = user.deactivatedAt === null;
                return (
                  <tr key={user.adminId} className="border-b border-[var(--color-border)] align-top">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[var(--color-text)] m-0">{user.email}</p>
                      <p className="font-mono text-xs text-[var(--color-text-muted)] m-0">{user.adminId}</p>
                      <p className="text-xs text-[var(--color-text-muted)] m-0">
                        Updated {user.updatedAt ? intlFormatDate(user.updatedAt, locale) : '-'}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <input
                          className="input"
                          value={draftNames[user.adminId] ?? ''}
                          onChange={(event) =>
                            setDraftNames((current) => ({
                              ...current,
                              [user.adminId]: event.target.value,
                            }))
                          }
                          aria-label={`Display name for ${user.email}`}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={isPending}
                          onClick={() =>
                            void updateUser(user.adminId, {
                              displayName: draftNames[user.adminId] ?? '',
                            })
                          }
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="input"
                        value={user.role}
                        disabled={isPending}
                        onChange={(event) =>
                          void updateUser(user.adminId, { role: event.target.value as AdminRole })
                        }
                        aria-label={`Role for ${user.email}`}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4">{user.totpEnrolled ? 'Enrolled' : 'Pending'}</td>
                    <td className="py-3 pr-4">
                      {isActive ? (
                        <span className="text-[var(--color-success)] font-medium">Active</span>
                      ) : (
                        <span className="text-[var(--color-danger)] font-medium">
                          Deactivated {user.deactivatedAt ? intlFormatDate(user.deactivatedAt, locale) : '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isPending}
                        onClick={() =>
                          void updateUser(user.adminId, {
                            deactivatedAt: isActive ? new Date().toISOString() : null,
                          })
                        }
                      >
                        {isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
