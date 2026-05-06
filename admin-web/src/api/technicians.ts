import { createApiClient, type ApiClient } from './client';
import { BROWSER_API_BASE_URL } from './base';
import type {
  AdminTechnicianListResponse,
  PatchTechnicianBody,
} from '../types/technician-admin';

const CLIENT_BASE = BROWSER_API_BASE_URL;

let _browserClient: ApiClient | undefined;
function getBrowserClient(): ApiClient {
  if (_browserClient === undefined) {
    _browserClient = createApiClient({ baseUrl: CLIENT_BASE, credentials: 'include' });
  }
  return _browserClient;
}

export async function listTechniciansClient(): Promise<AdminTechnicianListResponse> {
  return listTechnicians(getBrowserClient());
}

export async function patchTechnicianClient(
  id: string,
  body: PatchTechnicianBody,
): Promise<void> {
  return patchTechnician(getBrowserClient(), id, body);
}

export async function listTechnicians(
  client: ApiClient,
): Promise<AdminTechnicianListResponse> {
  const { data, error } = await client.GET('/v1/admin/technicians', {});
  if (error !== undefined || data === undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('listTechnicians: request failed');
  }
  return data;
}

export async function patchTechnician(
  client: ApiClient,
  id: string,
  body: PatchTechnicianBody,
): Promise<void> {
  const { data, error } = await client.PATCH('/v1/admin/technicians/{id}', {
    params: { path: { id } },
    body: body,
  });
  if (error !== undefined) {
    if ((error as unknown) instanceof Error) throw error as unknown as Error;
    throw new Error('patchTechnician: request failed');
  }
}
