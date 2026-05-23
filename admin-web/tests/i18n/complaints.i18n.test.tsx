import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string, _params?: Record<string, unknown>) => `[${ns}.${key}]`,
  useLocale: () => 'hi',
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async (ns: string) => (key: string) => `[${ns}.${key}]`,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/hi/complaints',
}));
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/hi/complaints',
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    ({ type: 'a', props: { href, children } }),
}));
vi.mock('@/api/complaints', () => ({
  listComplaints: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  patchComplaint: vi.fn(),
  getRepeatOffenders: vi.fn().mockResolvedValue([]),
}));
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (p: { innerRef: null; droppableProps: object; placeholder: null }) => React.ReactNode }) =>
    children({ innerRef: null, droppableProps: {}, placeholder: null }),
  Draggable: ({ children }: { children: (p: { innerRef: null; draggableProps: object; dragHandleProps: object }) => React.ReactNode }) =>
    children({ innerRef: null, draggableProps: {}, dragHandleProps: {} }),
}));

import { ComplaintsClient } from '../../app/[locale]/(dashboard)/complaints/ComplaintsClient';

describe('Complaints i18n extraction', () => {
  it('renders no hardcoded English title', () => {
    render(
      <ComplaintsClient
        initialComplaints={[]}
        totalComplaints={0}
        repeatOffenders={[]}
      />
    );
    expect(screen.queryByText('Complaints')).toBeNull();
  });
  it('renders i18n sentinel for title', () => {
    render(
      <ComplaintsClient
        initialComplaints={[]}
        totalComplaints={0}
        repeatOffenders={[]}
      />
    );
    expect(screen.getByText('[complaints.list.title]')).not.toBeNull();
  });
  it('renders i18n sentinel for Repeat Offenders title', () => {
    render(
      <ComplaintsClient
        initialComplaints={[]}
        totalComplaints={0}
        repeatOffenders={[]}
      />
    );
    expect(screen.getByText('[complaints.repeatOffenders.title]')).not.toBeNull();
  });
});
