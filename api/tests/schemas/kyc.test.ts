import { describe, it, expect } from 'vitest';
import {
  KycStatusSchema, TechnicianKycSchema,
  SubmitAadhaarRequestSchema, SubmitPanOcrRequestSchema,
} from '../../src/schemas/kyc.js';

describe('KycStatusSchema', () => {
  it('accepts all valid statuses', () => {
    ['PENDING','AADHAAR_DONE','PAN_DONE','COMPLETE','PENDING_MANUAL','MANUAL_REVIEW']
      .forEach(s => expect(KycStatusSchema.parse(s)).toBe(s));
  });
  it('rejects unknown status', () => {
    expect(() => KycStatusSchema.parse('VERIFIED')).toThrow();
  });
});

describe('SubmitAadhaarRequestSchema', () => {
  it('parses valid request', () => {
    const r = SubmitAadhaarRequestSchema.parse({
      technicianId: 'tech_1', authCode: 'abc123',
      redirectUri: 'https://example.com/callback',
    });
    expect(r.technicianId).toBe('tech_1');
  });
  it('rejects invalid redirectUri', () => {
    expect(() => SubmitAadhaarRequestSchema.parse({
      technicianId: 'tech_1', authCode: 'abc', redirectUri: 'not-a-url',
    })).toThrow();
  });
});

describe('TechnicianKycSchema', () => {
  it('parses full KYC document', () => {
    const kyc = TechnicianKycSchema.parse({
      aadhaarVerified: true, aadhaarMaskedNumber: 'XXXX-XXXX-1234',
      panNumber: 'ABCDE1234F', panImagePath: 'technicians/t1/pan.jpg',
      kycStatus: 'COMPLETE', updatedAt: new Date().toISOString(),
    });
    expect(kyc.aadhaarVerified).toBe(true);
  });
  it('allows nullable panNumber', () => {
    const kyc = TechnicianKycSchema.parse({
      aadhaarVerified: false, aadhaarMaskedNumber: null,
      panNumber: null, panImagePath: null,
      kycStatus: 'PENDING', updatedAt: new Date().toISOString(),
    });
    expect(kyc.panNumber).toBeNull();
  });
});

describe('SubmitPanOcrRequestSchema', () => {
  it('parses valid request', () => {
    const r = SubmitPanOcrRequestSchema.parse({
      technicianId: 'tech_1',
      firebaseStoragePath: 'technicians/tech_1/pan.jpg',
    });
    expect(r.firebaseStoragePath).toBe('technicians/tech_1/pan.jpg');
  });
  it('rejects empty firebaseStoragePath', () => {
    expect(() => SubmitPanOcrRequestSchema.parse({
      technicianId: 'tech_1',
      firebaseStoragePath: '',
    })).toThrow();
  });
});
