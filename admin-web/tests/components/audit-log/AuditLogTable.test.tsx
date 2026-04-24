import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogTable } from '@/components/audit-log/AuditLogTable';
import type { AuditLogEntry } from '@/types/audit-log';

const entry: AuditLogEntry = {
  id: 'e1',
  adminId: 'admin-1',
  role: 'super-admin',
  action: 'admin.login',
  resourceType: 'admin_session',
  resourceId: 'sess-abc',
  payload: { ip: '1.2.3.4', sessionId: 'sess-abc' },
  timestamp: '2026-04-20T10:00:00.000Z',
};

describe('AuditLogTable', () => {
  it('renders table headers', () => {
    render(<AuditLogTable entries={[entry]} />);
    expect(screen.getByRole('columnheader', { name: /timestamp/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /admin/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /action/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /resource type/i })).toBeDefined();
  });

  it('renders an empty state when entries is empty', () => {
    render(<AuditLogTable entries={[]} />);
    expect(screen.getByText(/no entries/i)).toBeDefined();
  });

  it('renders a row for each entry', () => {
    render(<AuditLogTable entries={[entry]} />);
    expect(screen.getByText('admin-1')).toBeDefined();
    expect(screen.getByText('admin.login')).toBeDefined();
    expect(screen.getByText('admin_session')).toBeDefined();
  });

  it('clicking a row expands the payload JSON', () => {
    render(<AuditLogTable entries={[entry]} />);
    fireEvent.click(screen.getByText('admin.login'));
    expect(screen.getByText(/"ip"/)).toBeDefined();
  });

  it('clicking an expanded row collapses it', () => {
    render(<AuditLogTable entries={[entry]} />);
    fireEvent.click(screen.getByText('admin.login'));
    fireEvent.click(screen.getByText('admin.login'));
    expect(screen.queryByText(/"ip"/)).toBeNull();
  });

  it('renders no edit or delete buttons', () => {
    render(<AuditLogTable entries={[entry]} />);
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });
});
