import type { ApiClient } from './client';
import type {
  Complaint,
  ComplaintListResponse,
  ComplaintResolutionCategory,
  RepeatOffender,
} from '../types/complaint';

// Client-side base URL — follows the same pattern as orders.ts / finance.ts.
// In production the env var is empty so paths resolve through the Next.js /api proxy.
const CLIENT_BASE = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

export async function patchComplaintClient(
  id: string,
  body: PatchComplaintParams,
): Promise<Complaint> {
  const res = await fetch(`${CLIENT_BASE}/api/v1/admin/complaints/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`patchComplaintClient failed: ${res.status}`);
  return res.json() as Promise<Complaint>;
}

export interface ListComplaintsParams {
  status?: string; // comma-separated
  assigneeAdminId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateComplaintParams {
  orderId: string;
  customerId: string;
  technicianId: string;
  description: string;
}

export interface PatchComplaintParams {
  status?: 'NEW' | 'INVESTIGATING' | 'RESOLVED';
  assigneeAdminId?: string;
  resolutionCategory?: ComplaintResolutionCategory;
  note?: string;
}

export async function listComplaints(
  client: ApiClient,
  params?: ListComplaintsParams,
): Promise<ComplaintListResponse> {
  const { data, error } = await client.GET('/v1/admin/complaints', {
    params: { query: params ?? {} },
  });
  if (error !== undefined || data === undefined) {
    throw new Error('listComplaints: request failed');
  }
  return data;
}

export async function createComplaint(
  client: ApiClient,
  body: CreateComplaintParams,
): Promise<Complaint> {
  const { data, error } = await client.POST('/v1/admin/complaints', {
    body: body,
  });
  if (error !== undefined || data === undefined) {
    throw new Error('createComplaint: request failed');
  }
  return data;
}

export async function patchComplaint(
  client: ApiClient,
  id: string,
  body: PatchComplaintParams,
): Promise<Complaint> {
  const { data, error } = await client.PATCH('/v1/admin/complaints/{id}', {
    params: { path: { id } },
    body: body,
  });
  if (error !== undefined || data === undefined) {
    throw new Error('patchComplaint: request failed');
  }
  return data;
}

export async function getRepeatOffenders(
  client: ApiClient,
): Promise<RepeatOffender[]> {
  const { data, error } = await client.GET(
    '/v1/admin/complaints/repeat-offenders',
  );
  if (error !== undefined || data === undefined) {
    throw new Error('getRepeatOffenders: request failed');
  }
  return (data).offenders;
}
