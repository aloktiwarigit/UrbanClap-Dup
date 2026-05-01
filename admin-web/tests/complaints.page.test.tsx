// admin-web/tests/complaints.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

vi.mock('@/lib/serverApi', () => ({
  getServerApiClient: async () => ({}),
}));

const listMock = vi.fn();
vi.mock('@/api/complaints', () => ({
  listComplaints: (...args: unknown[]) => listMock(...args),
}));

// Capture the props the page passes to its client component.
const clientProps: { current: unknown } = { current: undefined };
vi.mock('../app/(dashboard)/complaints/ComplaintsClient', () => ({
  ComplaintsClient: (props: unknown) => {
    clientProps.current = props;
    return null;
  },
}));

import ComplaintsPage from '../app/(dashboard)/complaints/page';

interface ClientProps {
  initialComplaints: ReadonlyArray<{ id: string }>;
  totalComplaints: number;
}

describe('ComplaintsPage', () => {
  beforeEach(() => {
    listMock.mockReset();
    clientProps.current = undefined;
  });

  it('passes empty list + 0 total when both queries reject', async () => {
    listMock.mockRejectedValue(new TypeError('fetch failed'));
    render(await ComplaintsPage());
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints).toEqual([]);
    expect(props.totalComplaints).toBe(0);
  });

  it('passes only the resolved query when one rejects', async () => {
    listMock
      .mockResolvedValueOnce({
        items: [{ id: 'a1', updatedAt: '2026-05-01T00:00:00Z' }],
        total: 1,
      })
      .mockRejectedValueOnce(new TypeError('fetch failed'));
    render(await ComplaintsPage());
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints.map((c) => c.id)).toEqual(['a1']);
    expect(props.totalComplaints).toBe(1);
  });

  it('deduplicates a complaint that appears in both result sets', async () => {
    listMock
      .mockResolvedValueOnce({
        items: [{ id: 'shared', updatedAt: '2026-05-01T00:00:00Z', status: 'INVESTIGATING' }],
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [{ id: 'shared', updatedAt: '2026-05-01T01:00:00Z', status: 'RESOLVED' }],
        total: 1,
      });
    render(await ComplaintsPage());
    const props = clientProps.current as ClientProps;
    expect(props.initialComplaints).toHaveLength(1);
    expect(props.totalComplaints).toBe(1);
  });
});
