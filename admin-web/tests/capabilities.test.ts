import { describe, expect, it } from 'vitest';
import {
  canAccessAdminPath,
  capabilitiesForRole,
  defaultPathForRole,
  hasCapability,
  navItemsForRole,
} from '../src/admin/capabilities';

describe('admin capability matrix', () => {
  it('grants every capability to super-admin', () => {
    expect(hasCapability('super-admin', 'adminUsers.manage')).toBe(true);
    expect(hasCapability('super-admin', 'finance.approvePayouts')).toBe(true);
    expect(hasCapability('super-admin', 'orders.financialOverride')).toBe(true);
  });

  it('keeps ops-manager out of financial override, audit, admin users, and compliance', () => {
    expect(capabilitiesForRole('ops-manager')).toEqual([
      'liveOps.read',
      'orders.read',
      'orders.override',
      'catalogue.manage',
      'finance.read',
      'complaints.manage',
    ]);
    expect(hasCapability('ops-manager', 'orders.financialOverride')).toBe(false);
    expect(hasCapability('ops-manager', 'audit.read')).toBe(false);
    expect(hasCapability('ops-manager', 'adminUsers.manage')).toBe(false);
    expect(hasCapability('ops-manager', 'compliance.manage')).toBe(false);
  });

  it('limits finance to finance read and not payout approval', () => {
    expect(capabilitiesForRole('finance')).toEqual(['finance.read']);
    expect(hasCapability('finance', 'finance.approvePayouts')).toBe(false);
    expect(navItemsForRole('finance').map((item) => item.href)).toEqual(['/finance']);
  });

  it('routes support-agent to not authorized by default', () => {
    expect(capabilitiesForRole('support-agent')).toEqual([]);
    expect(defaultPathForRole('support-agent')).toBe('/not-authorized');
  });

  it('guards direct admin paths by capability', () => {
    expect(canAccessAdminPath('finance', '/finance')).toBe(true);
    expect(canAccessAdminPath('finance', '/orders')).toBe(false);
    expect(canAccessAdminPath('ops-manager', '/catalogue/ac-repair')).toBe(true);
    expect(canAccessAdminPath('ops-manager', '/audit-log')).toBe(false);
    expect(canAccessAdminPath('super-admin', '/compliance')).toBe(true);
  });
});
