'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('catalogue');
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '');
  const [basePrice, setBasePrice] = useState(String(initial?.basePrice ?? ''));
  const [durationMinutes, setDurationMinutes] = useState(String(initial?.durationMinutes ?? ''));
  const [commissionBps, setCommissionBps] = useState(String(initial?.commissionBps ?? '2250'));
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
      setError(t('serviceForm.validationError'));
      return;
    }

    if (commissionNum < 1500 || commissionNum > 3500) {
      setError(t('serviceForm.commissionRangeError'));
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
      setError(err instanceof Error ? err.message : t('serviceForm.submissionError'));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '480px' }}>
      {!isEdit && (
        <div>
          <label htmlFor="svc-id" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
            {t('serviceForm.idLabel')}
          </label>
          <input
            id="svc-id"
            className="input"
            type="text"
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={t('serviceForm.idPlaceholder')}
          />
        </div>
      )}

      <div>
        <label htmlFor="svc-name" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.nameLabel')}
        </label>
        <input
          id="svc-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('serviceForm.namePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-desc" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.descriptionLabel')}
        </label>
        <input
          id="svc-desc"
          className="input"
          type="text"
          required
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder={t('serviceForm.descriptionPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-hero" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.heroImageLabel')}
        </label>
        <input
          id="svc-hero"
          className="input"
          type="url"
          required
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder={t('serviceForm.heroImagePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-price" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.priceLabel')}
        </label>
        <input
          id="svc-price"
          className="input"
          type="number"
          required
          min={0}
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder={t('serviceForm.pricePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-duration" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.durationLabel')}
        </label>
        <input
          id="svc-duration"
          className="input"
          type="number"
          required
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder={t('serviceForm.durationPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="svc-commission" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
          {t('serviceForm.commissionLabel')}
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
          placeholder={t('serviceForm.commissionPlaceholder')}
        />
      </div>

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
          {submitting ? t('serviceForm.savingState') : isEdit ? t('serviceForm.updateButton') : t('serviceForm.createButton')}
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
          {t('serviceForm.cancelButton')}
        </button>
      </div>
    </form>
  );
}
