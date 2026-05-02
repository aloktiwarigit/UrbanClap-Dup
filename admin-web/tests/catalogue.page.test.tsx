// admin-web/tests/catalogue.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import CataloguePage from '../app/(dashboard)/catalogue/page';

describe('CataloguePage', () => {
  beforeEach(() => fetchMock.mockReset());

  it('renders an editorial empty state when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const ui = await CataloguePage();
    render(ui);
    expect(
      screen.getByRole('heading', { name: /catalogue is empty/i }),
    ).toBeInTheDocument();
  });

  it('renders an empty state when fetch returns non-ok', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    const ui = await CataloguePage();
    render(ui);
    expect(screen.getByRole('heading', { name: /catalogue is empty/i })).toBeInTheDocument();
  });

  it('renders the category list when fetch returns data', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ categories: [{ id: 'c1', name: 'Plumbing', services: [] }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const ui = await CataloguePage();
    render(ui);
    expect(screen.getByText(/plumbing/i)).toBeInTheDocument();
  });
});
