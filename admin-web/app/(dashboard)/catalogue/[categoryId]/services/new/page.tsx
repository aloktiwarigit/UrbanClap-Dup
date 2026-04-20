'use client';

import { useParams, useRouter } from 'next/navigation';
import { ServiceForm } from '@/components/catalogue/ServiceForm';
import type { operations } from '@/api/generated/schema';

type CreateServiceBody = NonNullable<
  operations['adminCreateService']['requestBody']
>['content']['application/json'];

type UpdateServiceBody = NonNullable<
  operations['adminUpdateService']['requestBody']
>['content']['application/json'];

export default function NewServicePage() {
  const params = useParams();
  const router = useRouter();

  const categoryId = typeof params['categoryId'] === 'string' ? params['categoryId'] : '';

  async function handleSubmit(data: CreateServiceBody | UpdateServiceBody) {
    const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
    const res = await fetch(`${baseUrl}/v1/admin/catalogue/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`Failed to create service: ${res.status} ${text}`);
    }
    router.push(`/catalogue/${categoryId}`);
  }

  function handleCancel() {
    router.push(`/catalogue/${categoryId}`);
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        Add Service
      </h1>
      <ServiceForm
        categoryId={categoryId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
