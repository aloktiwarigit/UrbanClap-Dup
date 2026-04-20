export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import type { components } from '@/api/generated/schema';
import { CatalogueCategoryList } from './CatalogueCategoryList';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

async function fetchAdminCategories(token: string): Promise<AdminServiceCategory[]> {
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/v1/admin/catalogue/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { categories: AdminServiceCategory[] };
  return json.categories;
}

export default async function CataloguePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const categories = await fetchAdminCategories(token);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Service Catalogue
        </h1>
        <Link
          href="/catalogue/new"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-brand)',
            color: 'var(--color-brand-fg)',
            textDecoration: 'none',
          }}
        >
          New Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No categories found.</p>
      ) : (
        <CatalogueCategoryList categories={categories} />
      )}
    </div>
  );
}
