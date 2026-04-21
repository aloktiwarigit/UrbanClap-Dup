export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Route } from 'next';

import type { components } from '@/api/generated/schema';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];
type AdminService = components['schemas']['AdminService'];

async function fetchCategory(id: string, token: string): Promise<AdminServiceCategory | null> {
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/v1/admin/catalogue/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as AdminServiceCategory;
}

async function fetchServices(categoryId: string, token: string): Promise<AdminService[]> {
  const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
  const res = await fetch(
    `${baseUrl}/v1/admin/catalogue/services?categoryId=${encodeURIComponent(categoryId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );
  if (!res.ok) return [];
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
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link
            href="/catalogue"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-brand)', textDecoration: 'underline' }}
          >
            &larr; All Categories
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
            ID: {category.id} &mdash; Sort order: {category.sortOrder} &mdash;{' '}
            <span style={{ color: category.isActive ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          href={`/catalogue/${categoryId}/edit` as Route<`/catalogue/${string}/edit`>}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            textDecoration: 'none',
          }}
        >
          Edit Category
        </Link>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: 0 }}>Services</h2>
          <Link
            href={`/catalogue/${categoryId}/services/new`}
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
            Add Service
          </Link>
        </div>

        {services.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No services in this category yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{service.name}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                    ₹{(service.basePrice / 100).toFixed(0)} &mdash;{' '}
                    <span style={{ color: service.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/catalogue/${categoryId}/services/${service.id}`}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-brand)',
                    textDecoration: 'underline',
                  }}
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
