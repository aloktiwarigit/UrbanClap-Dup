'use client';

import { useState } from 'react';
import type { components, operations } from '@/api/generated/schema';

export type AdminService = components['schemas']['AdminService'];

type CreateServiceBody = NonNullable<
  operations['adminCreateService']['requestBody']
>['content']['application/json'];

type UpdateServiceBody = NonNullable<
  operations['adminUpdateService']['requestBody']
>['content']['application/json'];

export interface ServiceFormProps {
  categoryId: string;
  initial?: AdminService;
  onSubmit: (data: CreateServiceBody | UpdateServiceBody) => Promise<void>;
  onCancel: () => void;
}

export function ServiceForm({ categoryId, initial, onSubmit, onCancel }: ServiceFormProps) {
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '');
  const [basePrice, setBasePrice] = useState(String(initial?.basePrice ?? ''));
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? ''));
  const [commissionBps, setCommissionBps] = useState(String(initial?.commissionBps ?? '2250'));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = initial !== undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const basePriceNum = parseInt(basePrice, 10);
    const durationNum = parseInt(durationMinutes, 10);
    const commissionNum = parseInt(commissionBps, 10);

    if (isNaN(basePriceNum) || isNaN(durationNum) || isNaN(commissionNum)) {
      setError('Price, duration, and commission must be valid numbers.');
      return;
    }

    if (commissionNum < 1500 || commissionNum > 3500) {
      setError('Commission must be between 1500 and 3500 basis points.');
      return;
    }

    const common = {
      name,
      shortDescription,
      heroImageUrl,
      basePrice: basePriceNum,
      commissionBps: commissionNum,
      durationMinutes: durationNum,
      includes: [] as string[],
      faq: [] as { question: string; answer: string }[],
      addOns: [] as { id: string; name: string; price: number; triggerCondition: string }[],
      photoStages: [] as { id: string; label: string; required: boolean }[],
    };

    const data: CreateServiceBody | UpdateServiceBody = isEdit
      ? common
      : { ...common, id, categoryId };

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '480px' }}>
      {!isEdit && (
        <div>
          <label htmlFor="svc-id" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            ID (slug)
          </label>
          <input
            id="svc-id"
            className="input"
            type="text"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. ac-deep-clean"
          />
        </div>
      )}

      <div>
        <label htmlFor="svc-name" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Name
        </label>
        <input
          id="svc-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AC Deep Clean"
        />
      </div>

      <div>
        <label htmlFor="svc-desc" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Short Description
        </label>
        <input
          id="svc-desc"
          className="input"
          type="text"
          required
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="One-liner summary"
        />
      </div>

      <div>
        <label htmlFor="svc-hero" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Hero Image URL
        </label>
        <input
          id="svc-hero"
          className="input"
          type="url"
          required
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label htmlFor="svc-price" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Base Price (paise — ₹599 = 59900)
        </label>
        <input
          id="svc-price"
          className="input"
          type="number"
          required
          min={0}
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder="59900"
        />
      </div>

      <div>
        <label htmlFor="svc-duration" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Duration (minutes)
        </label>
        <input
          id="svc-duration"
          className="input"
          type="number"
          required
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="60"
        />
      </div>

      <div>
        <label htmlFor="svc-commission" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          Commission (basis points — 2250 = 22.5%, range 1500–3500)
        </label>
        <input
          id="svc-commission"
          className="input"
          type="number"
          required
          min={1500}
          max={3500}
          value={commissionBps}
          onChange={(e) => setCommissionBps(e.target.value)}
          placeholder="2250"
        />
      </div>

      {isEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            id="svc-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="svc-active" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Active
          </label>
        </div>
      )}

      {error !== null && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-brand)',
            color: 'var(--color-brand-fg)',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Saving…' : isEdit ? 'Update Service' : 'Create Service'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
