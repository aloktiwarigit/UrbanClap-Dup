// admin-web/tests/catalogue.page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'fake-jwt' }) }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async (_ns: string) => (key: string, params?: Record<string, unknown>): string => {
    if (params) {
      const vals = Object.values(params).filter(v => typeof v === 'string' || typeof v === 'number');
      if (vals.length === 1) return String(vals[0]);
      if (vals.length > 0) return vals.map(String).join(' ');
    }
    const last = key.split('.').pop() ?? key;
    return last.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  },
}));

vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string, params?: Record<string, unknown>): string => {
    if (params) {
      if ('h' in params && 'm' in params) return `${String(params.h)}h ${String(params.m)}m`;
      if ('m' in params && !('h' in params)) return `${String(params.m)}m`;
      const vals = Object.values(params).filter(v => typeof v === 'string' || typeof v === 'number');
      if (vals.length === 1) return String(vals[0]);
      if (vals.length > 0) return vals.map(String).join(' ');
    }
    const last = key.split('.').pop() ?? key;
    return last.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  },
  useLocale: () => 'en',
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import CataloguePage from '../app/[locale]/(dashboard)/catalogue/page';

describe('CataloguePage', () => {
  beforeEach(() => fetchMock.mockReset());

  it('throws when the catalogue fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(CataloguePage()).rejects.toThrow('fetch failed');
  });

  it('throws when the catalogue API returns non-ok', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    await expect(CataloguePage()).rejects.toThrow('Catalogue categories failed with HTTP 500');
  });

  it('renders an empty state when the API returns no categories', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ categories: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const ui = await CataloguePage();
    render(ui);
    expect(screen.getByRole('heading', { name: /headline/i })).toBeInTheDocument();
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
