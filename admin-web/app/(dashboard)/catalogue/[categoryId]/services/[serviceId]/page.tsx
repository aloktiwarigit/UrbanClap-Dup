export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { components } from '@/api/generated/schema';
import { EditServiceClient } from './EditServiceClient';

type AdminService = components['schemas']['AdminService'];

async function fetchService(id: string, token: string): Promise<AdminService | null> {
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/v1/admin/catalogue/services/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as AdminService;
}

interface PageProps {
  params: Promise<{ categoryId: string; serviceId: string }>;
}

export default async function EditServicePage({ params }: PageProps) {
  const { categoryId, serviceId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  const service = await fetchService(serviceId, token);

  if (service === null) {
    notFound();
  }

  return <EditServiceClient categoryId={categoryId} service={service} />;
}
