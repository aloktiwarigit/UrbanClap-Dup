export type TechnicianStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';
export type TechnicianKycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';
export type TechnicianHoldState = 'CLEAR' | 'WARN' | 'BLOCKED';

/**
 * Mirrors `CommissionHoldSchema` (api/src/schemas/technician.ts) — kept as a standalone shape
 * here rather than imported, the same way `HoldChip`'s own `HoldChipOverride` is, so this file
 * has no dependency on the generated schema beyond the fields it actually carries.
 */
export interface AdminTechnicianCommissionHold {
  outstandingPaise: number;
  dueCount: number;
  oldestDueAt?: string;
  state: TechnicianHoldState;
  evaluatedAt: string;
  override?: {
    until: string;
    byAdminId: string;
    reason: string;
  };
}

export interface AdminTechnician {
  id: string;
  name: string;
  phone: string;
  status: TechnicianStatus;
  kycStatus: TechnicianKycStatus;
  kycDocumentUrl?: string;
  serviceCategories: string[];
  commissionPct: number;
  activeBookingCount: number;
  lastActiveAt?: string;
  // Additive (task 10, E21-S03). Absent means "no hold has ever been computed for this
  // technician" — that is a distinct, and equally quiet, state from a computed CLEAR hold; never
  // treat absence as CLEAR.
  commissionHold?: AdminTechnicianCommissionHold;
}

export interface AdminTechnicianListResponse {
  technicians: AdminTechnician[];
}

export interface PatchTechnicianBody {
  status?: TechnicianStatus;
  commissionPct?: number;
  serviceCategories?: string[];
}
