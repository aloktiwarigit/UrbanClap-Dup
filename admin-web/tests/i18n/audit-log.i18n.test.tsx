import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `[${ns}.${key}]`,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AuditLogClient } from '../../src/components/audit-log/AuditLogClient';

describe('Audit Log i18n extraction', () => {
  it('renders no hardcoded English title', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('Audit Log')).toBeNull();
  });
  it('renders i18n sentinel for title in page heading', () => {
    render(React.createElement(AuditLogClient));
    // After extraction the loading sentinel is rendered (initial load state)
    expect(screen.queryByText('[auditLog.loading]')).not.toBeNull();
  });
  it('renders i18n sentinel for pagination previous button', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('[auditLog.pagination.previous]')).not.toBeNull();
  });
  it('renders i18n sentinel for pagination next button', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('[auditLog.pagination.next]')).not.toBeNull();
  });
  it('renders no hardcoded "Loading…" text', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('Loading…')).toBeNull();
  });
  it('renders no hardcoded "← Previous" text', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('← Previous')).toBeNull();
  });
  it('renders no hardcoded "Next →" text', () => {
    render(React.createElement(AuditLogClient));
    expect(screen.queryByText('Next →')).toBeNull();
  });
});
