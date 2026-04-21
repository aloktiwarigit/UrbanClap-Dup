import { createApiClient, type ApiClient } from './client';
import type {
  Complaint,
  ComplaintListResponse,
  ComplaintResolutionCategory,
  RepeatOffender,
} from '../types/complaint';

// Client-side base URL — follows the same pattern as orders.ts / finance.ts.
// In production the env var is empty so paths resolve through the Next.js /api proxy.
const CLIENT_BASE = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';

// Lazy singleton — created on first mutation call, reused for 401-refresh support.
let _browserClient: ApiClient | undefined;
function getBrowserClient(): ApiClient {
  if (_browserClient === undefined) {
    _browserClient = createApiClient({ baseUrl: CLIENT_BASE, credentials: 'include' });
  }
  return _browserClient;
}

export async function patchComplaintClient(
  id: string,
  body: PatchComplaintParams,
): Promise<Complaint> {
  return patchComplaint(getBrowserClient(), id, body);
}

export interface ListComplaintsParams {
  status?: string; // comma-separated
  assigneeAdminId?: string;
  dateFrom?: string;
  dateTo?: string;
  resolvedSince?: string;
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
