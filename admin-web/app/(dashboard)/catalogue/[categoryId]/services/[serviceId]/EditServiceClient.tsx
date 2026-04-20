'use client';

import { useRouter } from 'next/navigation';
import { ServiceForm } from '@/components/catalogue/ServiceForm';
import type { components, operations } from '@/api/generated/schema';

type AdminService = components['schemas']['AdminService'];

type CreateServiceBody = NonNullable<
  operations['adminCreateService']['requestBody']
>['content']['application/json'];

type UpdateServiceBody = NonNullable<
  operations['adminUpdateService']['requestBody']
>['content']['application/json'];

interface EditServiceClientProps {
  categoryId: string;
  service: AdminService;
}

export function EditServiceClient({ categoryId, service }: EditServiceClientProps) {
  const router = useRouter();

  async function handleSubmit(data: CreateServiceBody | UpdateServiceBody) {
    const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
    const res = await fetch(`${baseUrl}/v1/admin/catalogue/services/${service.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(`Failed to update service: ${res.status} ${text}`);
    }
    router.push(`/catalogue/${categoryId}`);
  }

  function handleCancel() {
    router.push(`/catalogue/${categoryId}`);
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
        Edit Service
      </h1>
      <ServiceForm
        categoryId={categoryId}
        initial={service}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
