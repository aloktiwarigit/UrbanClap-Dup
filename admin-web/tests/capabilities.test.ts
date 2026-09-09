import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROLES,
  ADMIN_ROUTE_CAPABILITIES,
  ALL_CAPABILITIES,
  PRIMARY_NAV_HIDDEN,
  canAccessAdminPath,
  capabilitiesForRole,
  capabilityForPath,
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
      'technicians.manage',
      'customers.manage',
      'orders.revealContact',
    ]);
    expect(hasCapability('ops-manager', 'orders.financialOverride')).toBe(false);
    expect(hasCapability('ops-manager', 'audit.read')).toBe(false);
    expect(hasCapability('ops-manager', 'adminUsers.manage')).toBe(false);
    expect(hasCapability('ops-manager', 'compliance.manage')).toBe(false);
  });

  it('limits finance to finance read + settle-commission, and not payout approval', () => {
    expect(capabilitiesForRole('finance')).toEqual(['finance.read', 'finance.settleCommission']);
    expect(hasCapability('finance', 'finance.approvePayouts')).toBe(false);
    expect(navItemsForRole('finance').map((item) => item.href)).toEqual([
      '/finance',
      '/finance/commissions',
    ]);
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

  it('canAccessAdminPath defaults deny on unknown paths', () => {
    const unknownPath = '/some/unregistered/route/that/does/not/exist';
    expect(canAccessAdminPath('super-admin', unknownPath)).toBe(false);
    expect(canAccessAdminPath('ops-manager', unknownPath)).toBe(false);
    expect(canAccessAdminPath('finance', unknownPath)).toBe(false);
    expect(canAccessAdminPath('support-agent', unknownPath)).toBe(false);
    expect(canAccessAdminPath(null, unknownPath)).toBe(false);
    expect(canAccessAdminPath(undefined, unknownPath)).toBe(false);
  });

  it('finance can settle commissions but cannot manage settings', () => {
    expect(hasCapability('finance', 'finance.settleCommission')).toBe(true);
    expect(hasCapability('finance', 'settings.manage')).toBe(false);
  });

  it('ops-manager can read finance but cannot settle commissions', () => {
    expect(hasCapability('ops-manager', 'finance.settleCommission')).toBe(false);
  });

  it('super-admin can manage settings', () => {
    expect(hasCapability('super-admin', 'settings.manage')).toBe(true);
  });

  it('every capability in the union is granted to at least one role', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(ADMIN_ROLES.some((r) => hasCapability(r, cap))).toBe(true);
    }
  });

  it('every guarded route maps to a capability that exists', () => {
    for (const { capability } of ADMIN_ROUTE_CAPABILITIES) {
      if (capability !== null) expect(ALL_CAPABILITIES).toContain(capability);
    }
  });

  it('audit log is reachable from the primary rail again', () => {
    expect(PRIMARY_NAV_HIDDEN.has('/audit-log')).toBe(false);
    expect(navItemsForRole('super-admin').map((i) => i.href)).toContain('/audit-log');
  });

  it('commission routes are guarded', () => {
    expect(canAccessAdminPath('finance', '/finance/commissions')).toBe(true);
    expect(canAccessAdminPath('support-agent', '/finance/commissions')).toBe(false);
    expect(canAccessAdminPath('finance', '/settings/commission')).toBe(false);
    expect(canAccessAdminPath('super-admin', '/settings/commission')).toBe(true);
  });

  it('resolves /finance/commissions to finance.settleCommission, not the more general /finance prefix', () => {
    // Regression guard for capabilityForPath's prefix-match ordering: the specific
    // '/finance/commissions' entry must be listed before the general '/finance'
    // entry in ADMIN_ROUTE_CAPABILITIES, or the general prefix wins and
    // finance.read would wrongly authorize the commission console.
    expect(capabilityForPath('/finance/commissions')).toBe('finance.settleCommission');
    expect(capabilityForPath('/finance/commissions/settle-123')).toBe('finance.settleCommission');
    // ops-manager has finance.read but not finance.settleCommission — this only
    // stays false if the specific prefix is matched first.
    expect(canAccessAdminPath('ops-manager', '/finance/commissions')).toBe(false);
    // Plain /finance still resolves to finance.read as before.
    expect(capabilityForPath('/finance')).toBe('finance.read');
  });
});

describe('orders.revealContact capability', () => {
  it('is granted to super-admin', () => {
    expect(hasCapability('super-admin', 'orders.revealContact')).toBe(true);
  });

  it('is granted to ops-manager', () => {
    expect(hasCapability('ops-manager', 'orders.revealContact')).toBe(true);
  });

  it('is denied to finance', () => {
    expect(hasCapability('finance', 'orders.revealContact')).toBe(false);
  });

  it('is denied to support-agent', () => {
    expect(hasCapability('support-agent', 'orders.revealContact')).toBe(false);
  });

  it('is denied to an unauthenticated caller', () => {
    expect(hasCapability(null, 'orders.revealContact')).toBe(false);
  });

  it('is listed in ALL_CAPABILITIES', () => {
    expect(ALL_CAPABILITIES).toContain('orders.revealContact');
  });
});
