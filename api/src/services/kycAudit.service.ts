import { auditLog } from './auditLog.service.js';

function maskPan(pan: string): string {
  if (pan.length !== 10) return '##########';
  return `${pan.slice(0, 5)}####${pan.slice(9)}`;
}

export function kycAuditEntry(
  technicianId: string,
  kycMethod: 'aadhaar' | 'pan',
  kycStatus: string,
  identifier: string | null,
): void {
  const action =
    kycMethod === 'aadhaar'
      ? kycStatus === 'AADHAAR_DONE'
        ? 'KYC_AADHAAR_VERIFIED'
        : 'KYC_AADHAAR_REJECTED'
      : kycStatus === 'PAN_DONE'
        ? 'KYC_PAN_VERIFIED'
        : 'KYC_PAN_REJECTED';

  const maskedIdentifier =
    kycMethod === 'pan' && identifier !== null ? maskPan(identifier) : identifier;

  void auditLog(
    { adminId: 'system', role: 'system' },
    action,
    'kyc',
    technicianId,
    { technicianId, kycStatus, maskedIdentifier },
  );
}
