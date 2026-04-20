import type { ApiClient } from './client';
import type {
  Complaint,
  ComplaintListResponse,
  RepeatOffender,
} from '../types/complaint';

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
  resolutionCategory?: string;
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
  return data as unknown as ComplaintListResponse;
}

export async function createComplaint(
  client: ApiClient,
  body: CreateComplaintParams,
): Promise<Complaint> {
  const { data, error } = await client.POST('/v1/admin/complaints', {
    body: body as never,
  });
  if (error !== undefined || data === undefined) {
    throw new Error('createComplaint: request failed');
  }
  return data as unknown as Complaint;
}

export async function patchComplaint(
  client: ApiClient,
  id: string,
  body: PatchComplaintParams,
): Promise<Complaint> {
  const { data, error } = await client.PATCH('/v1/admin/complaints/{id}', {
    params: { path: { id } },
    body: body as never,
  });
  if (error !== undefined || data === undefined) {
    throw new Error('patchComplaint: request failed');
  }
  return data as unknown as Complaint;
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
  return data as unknown as RepeatOffender[];
}
