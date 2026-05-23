import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, _params?: Record<string, unknown>) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('@/api/compliance', () => ({
  executeErasureRequest: vi.fn(),
  denyErasureRequest: vi.fn(),
  approveSscLevy: vi.fn(),
}));

import { ComplianceClient } from '../../app/[locale]/(dashboard)/compliance/ComplianceClient';

describe('Compliance i18n extraction', () => {
  it('renders no hardcoded English heading', () => {
    render(
      <ComplianceClient
        initialErasureRequests={[]}
        initialSscLevies={[]}
      />
    );
    expect(screen.queryByText('Compliance')).toBeNull();
    expect(screen.queryByText('Compliance operations')).toBeNull();
  });
  it('renders i18n sentinel for title', () => {
    render(
      <ComplianceClient
        initialErasureRequests={[]}
        initialSscLevies={[]}
      />
    );
    expect(screen.queryByText('[compliance.title]')).not.toBeNull();
  });
  it('renders i18n sentinel for eyebrow', () => {
    render(
      <ComplianceClient
        initialErasureRequests={[]}
        initialSscLevies={[]}
      />
    );
    expect(screen.queryByText('[compliance.eyebrow]')).not.toBeNull();
  });
  it('renders i18n sentinel for erasure heading', () => {
    render(
      <ComplianceClient
        initialErasureRequests={[]}
        initialSscLevies={[]}
      />
    );
    expect(screen.queryByText('[compliance.erasure.heading]')).not.toBeNull();
  });
  it('renders i18n sentinel for SSC levy heading', () => {
    render(
      <ComplianceClient
        initialErasureRequests={[]}
        initialSscLevies={[]}
      />
    );
    expect(screen.queryByText('[compliance.sscLevy.heading]')).not.toBeNull();
  });
});
