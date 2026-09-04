// E22-S01 — bilingual catalogue: the category edit payload gains an optional
// `nameHi`. Mirrors the ServiceForm bilingual-fields coverage: a filled Hindi
// name round-trips into the payload, and a blank one is omitted rather than
// sent as `''` (the server rejects `nameHi.min(1)`).

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'en',
}));

import { CategoryForm } from '../../../src/components/catalogue/CategoryForm';
import type { components } from '../../../src/api/generated/schema';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

const existingCategory = {
  id: 'ac-repair',
  name: 'AC Repair',
  heroImageUrl: 'https://example.com/cat.jpg',
  sortOrder: 10,
  isActive: true,
  updatedBy: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as AdminServiceCategory;

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('form not rendered');
  fireEvent.submit(form);
}

describe('CategoryForm — bilingual fields (E22-S01)', () => {
  it('round-trips Hindi copy on edit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const withHindi = { ...existingCategory, nameHi: 'एसी मरम्मत' } as AdminServiceCategory;

    render(<CategoryForm initial={withHindi} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(payload.nameHi).toBe('एसी मरम्मत');
  });

  it('omits nameHi when the field is left blank', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm initial={existingCategory} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect('nameHi' in payload).toBe(false);
  });
});
