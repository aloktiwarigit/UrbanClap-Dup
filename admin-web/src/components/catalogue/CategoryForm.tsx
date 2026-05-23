'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { components, operations } from '@/api/generated/schema';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

type CreateCategoryBody = NonNullable<
  operations['adminCreateCategory']['requestBody']
>['content']['application/json'];

type UpdateCategoryBody = NonNullable<
  operations['adminUpdateCategory']['requestBody']
>['content']['application/json'];

export interface CategoryFormProps {
  initial?: AdminServiceCategory;
  onSubmit: (data: CreateCategoryBody | UpdateCategoryBody) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
  const t = useTranslations('catalogue');
  const isEdit = initial !== undefined;
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.heroImageUrl ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const sortOrderNum = Number.parseInt(sortOrder, 10);
    if (!Number.isInteger(sortOrderNum) || sortOrderNum < 0) {
      setError(t('form.sortOrderError'));
      return;
    }

    const common = {
      name,
      heroImageUrl,
      sortOrder: sortOrderNum,
    };
    const data: CreateCategoryBody | UpdateCategoryBody = isEdit ? common : { ...common, id };

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.submissionError'));
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        maxWidth: '520px',
      }}
    >
      {!isEdit && (
        <div>
          <label
            htmlFor="category-id"
            style={{
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              marginBottom: 'var(--space-1)',
            }}
          >
            {t('form.idLabel')}
          </label>
          <input
            id="category-id"
            className="input"
            type="text"
            required
            pattern="[a-z0-9-]+"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder={t('form.idPlaceholder')}
          />
        </div>
      )}

      <div>
        <label
          htmlFor="category-name"
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            marginBottom: 'var(--space-1)',
          }}
        >
          {t('form.nameLabel')}
        </label>
        <input
          id="category-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('form.namePlaceholder')}
        />
      </div>

      <div>
        <label
          htmlFor="category-hero"
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            marginBottom: 'var(--space-1)',
          }}
        >
          {t('form.heroImageLabel')}
        </label>
        <input
          id="category-hero"
          className="input"
          type="url"
          required
          value={heroImageUrl}
          onChange={(event) => setHeroImageUrl(event.target.value)}
          placeholder={t('form.heroImagePlaceholder')}
        />
      </div>

      <div>
        <label
          htmlFor="category-sort"
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            marginBottom: 'var(--space-1)',
          }}
        >
          {t('form.sortOrderLabel')}
        </label>
        <input
          id="category-sort"
          className="input"
          type="number"
          min={0}
          required
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder={t('form.sortOrderPlaceholder')}
        />
      </div>

      {error !== null && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t('form.savingState') : isEdit ? t('form.updateButton') : t('form.createButton')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          {t('form.cancelButton')}
        </button>
      </div>
    </form>
  );
}
