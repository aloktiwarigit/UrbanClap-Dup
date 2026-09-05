// P0-3 — Editing a service price must not destroy its content.
//
// The form used to submit `includes: []`, `faq: []`, `addOns: []` and
// `photoStages: []` on every save, because the server's update body wrongly
// required them. The API merged those empties over the stored document, so one
// price change wiped the service's add-ons, FAQ, "includes" bullets and its
// photoStages — the last of which drives the technician guided-photo flow (E06-S02),
// silently removing the evidence chain for completed jobs while commission was
// still charged.
//
// The update body is now a partial patch, so the fix is for the form to send only
// the fields it actually owns. These tests pin that payload shape.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `[${ns}.${key}]`,
  useLocale: () => 'en',
}));

import { ServiceForm } from '../../../src/components/catalogue/ServiceForm';
import type { components } from '../../../src/api/generated/schema';

type AdminService = components['schemas']['AdminService'];

const existingService = {
  id: 'ac-deep-clean',
  categoryId: 'ac-repair',
  name: 'AC Deep Clean',
  shortDescription: 'Chemical wash, gas check, filter clean.',
  heroImageUrl: 'https://example.com/svc.jpg',
  basePrice: 59900,
  commissionBps: 2250,
  durationMinutes: 90,
  includes: ['Chemical wash', 'Gas pressure check'],
  faq: [{ question: 'How long?', answer: 'About 90 minutes.' }],
  addOns: [{ id: 'gas-refill', name: 'Gas Refill', price: 149900, triggerCondition: 'if pressure low' }],
  photoStages: [{ id: 'before', label: 'Before', required: true }],
  isActive: true,
} as unknown as AdminService;

const CONTENT_FIELDS = ['includes', 'faq', 'addOns', 'photoStages'] as const;

function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('form not rendered');
  fireEvent.submit(form);
}

describe('ServiceForm — edit payload (P0-3)', () => {
  it('omits the content arrays entirely so the server preserves them', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ServiceForm
        categoryId="ac-repair"
        initial={existingService}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    for (const field of CONTENT_FIELDS) {
      expect(field in payload, `edit payload must not carry "${field}"`).toBe(false);
    }
  });

  it('never sends an empty array for a content field', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ServiceForm
        categoryId="ac-repair"
        initial={existingService}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    for (const [key, value] of Object.entries(payload)) {
      expect(
        Array.isArray(value) && value.length === 0,
        `"${key}" was submitted as an empty array — this is the wipe bug`,
      ).toBe(false);
    }
  });

  it('still submits the fields the form owns, including an edited price', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ServiceForm
        categoryId="ac-repair"
        initial={existingService}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    const priceInput = screen.getByDisplayValue('59900');
    fireEvent.change(priceInput, { target: { value: '99900' } });

    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: 'AC Deep Clean',
      shortDescription: 'Chemical wash, gas check, filter clean.',
      heroImageUrl: 'https://example.com/svc.jpg',
      basePrice: 99900,
      commissionBps: 2250,
      durationMinutes: 90,
    });
  });

  it('does not send id or categoryId on edit — identity is not client-controlled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ServiceForm
        categoryId="ac-repair"
        initial={existingService}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect('id' in payload).toBe(false);
    expect('categoryId' in payload).toBe(false);
  });
});

describe('ServiceForm — create payload (P0-3)', () => {
  it('still sends the content arrays, which CREATE requires', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<ServiceForm categoryId="ac-repair" onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/serviceForm.idLabel/), {
      target: { value: 'inverter-install' },
    });
    fireEvent.change(screen.getByLabelText(/serviceForm.nameLabel/), {
      target: { value: 'Inverter Installation' },
    });
    fireEvent.change(screen.getByLabelText(/serviceForm.descriptionLabel/), {
      target: { value: 'Install and commission an inverter.' },
    });
    fireEvent.change(screen.getByLabelText(/serviceForm.heroImageLabel/), {
      target: { value: 'https://example.com/inv.jpg' },
    });
    fireEvent.change(screen.getByLabelText(/serviceForm.priceLabel/), {
      target: { value: '49900' },
    });
    fireEvent.change(screen.getByLabelText(/serviceForm.durationLabel/), {
      target: { value: '120' },
    });

    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(payload.id).toBe('inverter-install');
    expect(payload.categoryId).toBe('ac-repair');
    for (const field of CONTENT_FIELDS) {
      expect(field in payload, `create payload must carry "${field}"`).toBe(true);
    }
  });
});

describe('ServiceForm — bilingual fields (E22-S01)', () => {
  it('round-trips Hindi copy on edit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const withHindi = { ...existingService, nameHi: 'एसी डीप क्लीन', shortDescriptionHi: 'केमिकल वॉश।' } as AdminService;

    render(<ServiceForm categoryId="ac-repair" initial={withHindi} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(payload.nameHi).toBe('एसी डीप क्लीन');
    expect(payload.shortDescriptionHi).toBe('केमिकल वॉश।');
  });

  it('still omits the content arrays — P0-3 must not regress', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ServiceForm categoryId="ac-repair" initial={existingService} onSubmit={onSubmit} onCancel={vi.fn()} />);
    submitForm();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0]?.[0] as Record<string, unknown>;

    for (const field of CONTENT_FIELDS) {
      expect(field in payload).toBe(false);
    }
  });
});
