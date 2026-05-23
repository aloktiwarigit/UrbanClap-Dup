import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('@/api/adminUsers', () => ({
  patchAdminUser: vi.fn(),
}));

import { AdminUsersClient } from '../../app/[locale]/(dashboard)/admin-users/AdminUsersClient';

describe('AdminUsers i18n extraction', () => {
  it('renders no hardcoded English heading', () => {
    render(React.createElement(AdminUsersClient, { initialUsers: [] }));
    expect(screen.queryByText('Admin Users')).toBeNull();
    expect(screen.queryByText('Identity and access')).toBeNull();
  });
  it('renders i18n sentinel for title', () => {
    render(React.createElement(AdminUsersClient, { initialUsers: [] }));
    expect(screen.queryByText('[adminUsers.title]')).not.toBeNull();
  });
  it('renders i18n sentinel for eyebrow', () => {
    render(React.createElement(AdminUsersClient, { initialUsers: [] }));
    expect(screen.queryByText('[adminUsers.eyebrow]')).not.toBeNull();
  });
  it('renders i18n sentinel for emptyState when no users', () => {
    render(React.createElement(AdminUsersClient, { initialUsers: [] }));
    expect(screen.queryByText('[adminUsers.emptyState]')).not.toBeNull();
  });
  it('renders no hardcoded empty state text', () => {
    render(React.createElement(AdminUsersClient, { initialUsers: [] }));
    expect(screen.queryByText('No admin users returned by the API.')).toBeNull();
  });
});
