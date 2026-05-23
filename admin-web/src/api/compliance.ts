import { apiUrl } from './base';
import type {
  ErasureDenialReason,
  ErasureDeletedCounts,
  ErasureRequestStatus,
} from '@/types/compliance';

export interface ErasurePatchResult {
  erasureId: string;
  status: ErasureRequestStatus;
  deletedCounts?: ErasureDeletedCounts;
  executedAt?: string;
  denialReason?: ErasureDenialReason;
  deniedAt?: string;
}

export interface ApproveSscLevyResult {
  levyId: string;
  quarter: string;
  transferId: string;
  status: 'TRANSFERRED';
}

export async function executeErasureRequest(id: string): Promise<ErasurePatchResult> {
  const res = await fetch(apiUrl(`/v1/admin/erasure-requests/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'EXECUTE' }),
  });
  if (!res.ok) throw new Error(`Execute erasure ${res.status}`);
  return res.json() as Promise<ErasurePatchResult>;
}

export async function denyErasureRequest(
  id: string,
  reason: ErasureDenialReason,
): Promise<ErasurePatchResult> {
  const res = await fetch(apiUrl(`/v1/admin/erasure-requests/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'DENY', reason }),
  });
  if (!res.ok) throw new Error(`Deny erasure ${res.status}`);
  return res.json() as Promise<ErasurePatchResult>;
}

export async function approveSscLevy(id: string): Promise<ApproveSscLevyResult> {
  const res = await fetch(apiUrl(`/v1/admin/compliance/ssc-levy/${id}/approve`), {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Approve SSC levy ${res.status}`);
  return res.json() as Promise<ApproveSscLevyResult>;
}
