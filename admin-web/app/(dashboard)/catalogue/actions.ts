'use server';

import { cookies } from 'next/headers';
import type { components } from '@/api/generated/schema';

type AdminServiceCategory = components['schemas']['AdminServiceCategory'];
type AdminService = components['schemas']['AdminService'];

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('hs_access')?.value ?? '';
}

function apiBase(): string {
  return process.env['API_BASE_URL'] ?? 'http://localhost:3001';
}

export async function toggleCategoryAction(id: string): Promise<AdminServiceCategory | null> {
  const token = await getToken();
  const res = await fetch(`${apiBase()}/v1/admin/catalogue/categories/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as AdminServiceCategory;
}

export async function toggleServiceAction(id: string): Promise<AdminService | null> {
  const token = await getToken();
  const res = await fetch(`${apiBase()}/v1/admin/catalogue/services/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as AdminService;
}
