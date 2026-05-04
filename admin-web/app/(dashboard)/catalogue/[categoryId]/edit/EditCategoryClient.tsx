'use client';

import { useRouter } from 'next/navigation';
import { apiUrl } from '@/api/base';
import { CategoryForm } from '@/components/catalogue/CategoryForm';
import type { components, operations } from '@/api/generated/schema';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

type CreateCategoryBody = NonNullable<
  operations['adminCreateCategory']['requestBody']
>['content']['application/json'];

type UpdateCategoryBody = NonNullable<
  operations['adminUpdateCategory']['requestBody']
>['content']['application/json'];

interface EditCategoryClientProps {
  category: AdminServiceCategory;
}

export function EditCategoryClient({ category }: EditCategoryClientProps) {
  const router = useRouter();

  async function handleSubmit(data: CreateCategoryBody | UpdateCategoryBody) {
    const res = await fetch(apiUrl(`/v1/admin/catalogue/categories/${category.id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`Failed to update category: ${res.status} ${text}`);
    }
    router.push(`/catalogue/${category.id}`);
  }

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        Edit Category
      </h1>
      <CategoryForm
        initial={category}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/catalogue/${category.id}`)}
      />
    </div>
  );
}
