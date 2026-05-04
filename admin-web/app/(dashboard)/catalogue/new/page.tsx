'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@/api/base';
import { CategoryForm } from '@/components/catalogue/CategoryForm';
import type { operations } from '@/api/generated/schema';

type CreateCategoryBody = NonNullable<
  operations['adminCreateCategory']['requestBody']
>['content']['application/json'];

type UpdateCategoryBody = NonNullable<
  operations['adminUpdateCategory']['requestBody']
>['content']['application/json'];

export default function NewCategoryPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateCategoryBody | UpdateCategoryBody) {
    const res = await fetch(apiUrl('/v1/admin/catalogue/categories'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create category: ${res.status} ${text}`);
    }
    router.push('/catalogue');
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
      <Link
        href="/catalogue"
        style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand)', textDecoration: 'underline' }}
      >
        Back to catalogue
      </Link>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        New Category
      </h1>
      <CategoryForm onSubmit={handleSubmit} onCancel={() => router.push('/catalogue')} />
    </div>
  );
}
