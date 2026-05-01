export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import type { components } from '@/api/generated/schema';
import { EmptyState } from '@/components/EmptyState';
import { CatalogueCategoryList } from './CatalogueCategoryList';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

async function fetchAdminCategories(token: string): Promise<AdminServiceCategory[]> {
  // Raw fetch — the generated schema declares only POST for this path
  // (src/api/generated/schema.d.ts:119), so client.GET(...) does not typecheck.
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:7071/api';
  const [result] = await Promise.allSettled([
    fetch(`${baseUrl}/v1/admin/catalogue/categories`, {
      headers: { Cookie: `hs_access=${token}` },
      cache: 'no-store',
    }),
  ]);
  if (result.status !== 'fulfilled' || !result.value.ok) return [];
  try {
    const json = (await result.value.json()) as { categories: AdminServiceCategory[] };
    return json.categories ?? [];
  } catch {
    return [];
  }
}

export default async function CataloguePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const categories = await fetchAdminCategories(token);

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Service Catalogue
        </h1>
        <Link href="/catalogue/new" className="btn btn-primary">
          New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          eyebrow="Catalogue"
          headline="The catalogue is empty"
          copy="Either no categories have been provisioned yet, or the API is offline. Create one to get started."
        />
      ) : (
        <CatalogueCategoryList categories={categories} />
      )}
    </div>
  );
}
