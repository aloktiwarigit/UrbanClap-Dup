import type { ApiClient } from './client';
import { BROWSER_API_BASE_URL } from './base';
import type { AdminTechnicianListResponse, PatchTechnicianBody } from '@/types/technician-admin';

const BASE = BROWSER_API_BASE_URL;

export async function listTechnicians(client: ApiClient): Promise<AdminTechnicianListResponse> {
  const { data, error } = await client.GET('/v1/admin/technicians' as never, {} as never);
  if (error !== undefined || data === undefined) throw new Error('listTechnicians: request failed');
  return data;
}

export async function patchTechnician(id: string, body: PatchTechnicianBody): Promise<void> {
  const res = await fetch(`${BASE}/v1/admin/technicians/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`patchTechnician: ${res.status}`);
}
