export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Route } from 'next';
import type { components } from '@/api/generated/schema';
import { getApiBaseUrl } from '@/lib/apiBase';
import { handleAdminFetchError } from '@/lib/serverFetch';
import { ServiceList } from './ServiceList';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];
type AdminService = components['schemas']['AdminService'];

async function fetchCategory(id: string, token: string): Promise<AdminServiceCategory | null> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/v1/admin/catalogue/categories/${id}`, {
    headers: { Cookie: `hs_access=${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) handleAdminFetchError(res, 'Catalogue category');
  return (await res.json()) as AdminServiceCategory;
}

async function fetchServices(categoryId: string, token: string): Promise<AdminService[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(
    `${baseUrl}/v1/admin/catalogue/services?categoryId=${encodeURIComponent(categoryId)}`,
    {
      headers: { Cookie: `hs_access=${token}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) handleAdminFetchError(res, 'Catalogue services');
  const json = (await res.json()) as { services: AdminService[] };
  return json.services;
}

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { categoryId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';

  const [category, services] = await Promise.all([
    fetchCategory(categoryId, token),
    fetchServices(categoryId, token),
  ]);

  if (category === null) {
    notFound();
  }

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link
            href="/catalogue"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand)', textDecoration: 'underline' }}
          >
            Back to all categories
          </Link>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginTop: 'var(--space-2)',
              marginBottom: 0,
            }}
          >
            {category.name}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 'var(--space-1) 0 0 0' }}>
            ID: {category.id} - Sort order: {category.sortOrder} -{' '}
            <span style={{ color: category.isActive ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
        <Link
          href={`/catalogue/${categoryId}/edit` as Route}
          className="btn btn-ghost"
          style={{ textDecoration: 'none' }}
        >
          Edit Category
        </Link>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0 }}>Services</h2>
          <Link
            href={`/catalogue/${categoryId}/services/new` as Route}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Add Service
          </Link>
        </div>

        <ServiceList categoryId={categoryId} services={services} />
      </div>
    </div>
  );
}
