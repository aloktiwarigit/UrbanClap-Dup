'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CategoryCard } from '@/components/catalogue/CategoryCard';
import type { components } from '@/api/generated/schema';
import { toggleCategoryAction } from './actions';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

interface CatalogueCategoryListProps {
  categories: AdminServiceCategory[];
}

export function CatalogueCategoryList({ categories: initial }: CatalogueCategoryListProps) {
  const [categories, setCategories] = useState<AdminServiceCategory[]>(initial);
  const [_isPending, startTransition] = useTransition();

  function handleToggle(id: string) {
    startTransition(async () => {
      const updated = await toggleCategoryAction(id);
      if (updated !== null) {
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {categories.map((category) => (
        <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <CategoryCard category={category} onToggle={handleToggle} />
          <Link
            href={`/catalogue/${category.id}` as Route}
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-brand)',
              textDecoration: 'underline',
            }}
          >
            View services
          </Link>
        </div>
      ))}
    </div>
  );
}
