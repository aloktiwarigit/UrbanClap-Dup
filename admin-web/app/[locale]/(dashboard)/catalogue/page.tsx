export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { components } from '@/api/generated/schema';
import { EmptyState } from '@/components/EmptyState';
import { getApiBaseUrl } from '@/lib/apiBase';
import { handleAdminFetchError } from '@/lib/serverFetch';
import { CatalogueCategoryList } from './CatalogueCategoryList';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];

async function fetchAdminCategories(token: string): Promise<AdminServiceCategory[]> {
  // Raw fetch — the generated schema declares only POST for this path
  // (src/api/generated/schema.d.ts:119), so client.GET(...) does not typecheck.
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/v1/admin/catalogue/categories`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });

  if (!res.ok) handleAdminFetchError(res, 'Catalogue categories');
  const json = (await res.json()) as { categories?: AdminServiceCategory[] };
  return json.categories ?? [];
}

export default async function CataloguePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  const [categories, t] = await Promise.all([
    fetchAdminCategories(token),
    getTranslations('catalogue'),
  ]);

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
          {t('list.title')}
        </h1>
        <Link href="/catalogue/new" className="btn btn-primary">
          {t('list.newButton')}
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          eyebrow={t('emptyState.eyebrow')}
          headline={t('emptyState.headline')}
          copy={t('emptyState.description')}
        />
      ) : (
        <CatalogueCategoryList categories={categories} />
      )}
    </div>
  );
}
