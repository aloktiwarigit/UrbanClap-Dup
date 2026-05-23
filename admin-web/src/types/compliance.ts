export type ErasureRequestStatus =
  | 'PENDING'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'REVOKED'
  | 'DENIED'
  | 'FAILED';

export type ErasureDenialReason =
  | 'legal-hold'
  | 'regulatory-retention-conflict'
  | 'fraud-investigation';

export interface ErasureDeletedCounts {
  bookings: number;
  ratings: number;
  complaints: number;
  walletLedgerAnonymized: number;
  bookingEventsAnonymized: number;
  dispatchAttemptsAnonymized: number;
  auditLogAnonymized: number;
  technicianHardDeleted: boolean;
  kycHardDeleted: boolean;
  fcmTokensCleared: boolean;
}

export interface ErasureRequest {
  id: string;
  userId: string;
  userRole: 'CUSTOMER' | 'TECHNICIAN';
  status: ErasureRequestStatus;
  reason?: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  executedAt?: string;
  deniedAt?: string;
  denialReason?: ErasureDenialReason;
  failedAt?: string;
  failureReason?: string;
  deletedCounts?: ErasureDeletedCounts;
}

export interface ErasureRequestsResponse {
  items: ErasureRequest[];
}

export type SscLevyStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'TRANSFERRED' | 'FAILED';

export interface SscLevy {
  id: string;
  quarter: string;
  gmv: number;
  levyRate: 0.01 | 0.02;
  levyAmount: number;
  status: SscLevyStatus;
  razorpayTransferId?: string;
  approvedAt?: string;
  transferredAt?: string;
  createdAt: string;
}

export interface SscLeviesResponse {
  levies: SscLevy[];
}
