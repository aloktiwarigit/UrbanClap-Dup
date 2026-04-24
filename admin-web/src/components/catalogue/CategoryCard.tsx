'use client';

import type { components } from '@/api/generated/schema';

export type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

export interface CategoryCardProps {
  category: AdminServiceCategory;
  onToggle: (id: string) => void;
}

export function CategoryCard({ category, onToggle }: CategoryCardProps) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {category.name}
        </h3>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: category.isActive ? 'var(--color-success)' : 'var(--color-danger)',
            color: '#fff',
          }}
        >
          {category.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
        ID: {category.id}
      </p>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
        Sort order: {category.sortOrder}
      </p>

      <button
        onClick={() => onToggle(category.id)}
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-1) var(--space-3)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          background: category.isActive ? 'var(--color-danger)' : 'var(--color-success)',
          color: '#fff',
          border: 'none',
        }}
      >
        {category.isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}
