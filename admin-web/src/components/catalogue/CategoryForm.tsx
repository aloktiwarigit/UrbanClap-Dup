'use client';

import { useState } from 'react';
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
      setError('Sort order must be a non-negative integer.');
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
      setError(err instanceof Error ? err.message : 'Submission failed.');
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
            ID (slug)
          </label>
          <input
            id="category-id"
            className="input"
            type="text"
            required
            pattern="[a-z0-9-]+"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="e.g. ac-repair"
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
          Name
        </label>
        <input
          id="category-name"
          className="input"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. AC Repair"
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
          Hero Image URL
        </label>
        <input
          id="category-hero"
          className="input"
          type="url"
          required
          value={heroImageUrl}
          onChange={(event) => setHeroImageUrl(event.target.value)}
          placeholder="https://..."
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
          Sort Order
        </label>
        <input
          id="category-sort"
          className="input"
          type="number"
          min={0}
          required
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="10"
        />
      </div>

      {error !== null && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
