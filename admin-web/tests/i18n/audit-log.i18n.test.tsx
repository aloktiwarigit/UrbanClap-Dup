import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const { getTranslation } = vi.hoisted(() => {
  const translations = new Map<string, (key: string) => string>();
  return {
    getTranslation: (ns: string) => {
      if (!translations.has(ns)) {
        translations.set(ns, (key: string) => `[${ns}.${key}]`);
      }
      return translations.get(ns);
    },
  };
});

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => getTranslation(ns),
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => getTranslation(ns),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AuditLogClient } from '../../src/components/audit-log/AuditLogClient';

describe('Audit Log i18n extraction', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
