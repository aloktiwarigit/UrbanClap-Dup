export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { components } from '@/api/generated/schema';
import { getApiBaseUrl } from '@/lib/apiBase';
import { handleAdminFetchError } from '@/lib/serverFetch';
import { EditCategoryClient } from './EditCategoryClient';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

async function fetchCategory(id: string, token: string): Promise<AdminServiceCategory | null> {
  const res = await fetch(`${getApiBaseUrl()}/v1/admin/catalogue/categories/${id}`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) handleAdminFetchError(res, 'Catalogue category');
  return (await res.json()) as AdminServiceCategory;
}

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const category = await fetchCategory(categoryId, token);

  if (category === null) {
    notFound();
  }

  return <EditCategoryClient category={category} />;
}
