export type TechnicianStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED';
export type TechnicianKycStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

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
}

export interface AdminTechnicianListResponse {
  technicians: AdminTechnician[];
}

export interface PatchTechnicianBody {
  status?: TechnicianStatus;
  commissionPct?: number;
  serviceCategories?: string[];
}
