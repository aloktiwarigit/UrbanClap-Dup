import type { AdminRole } from '@/lib/auth/types';

export const ADMIN_ROLES = [
  'super-admin',
  'ops-manager',
  'finance',
  'support-agent',
] as const satisfies readonly AdminRole[];

export type Capability =
  | 'liveOps.read'
  | 'orders.read'
  | 'orders.override'
  | 'orders.financialOverride'
  | 'catalogue.manage'
  | 'finance.read'
  | 'finance.approvePayouts'
  | 'complaints.manage'
  | 'audit.read'
  | 'adminUsers.manage'
  | 'compliance.manage'
  | 'technicians.manage'
  | 'customers.manage';

export const ALL_CAPABILITIES = [
  'liveOps.read',
  'orders.read',
  'orders.override',
  'orders.financialOverride',
  'catalogue.manage',
  'finance.read',
  'finance.approvePayouts',
  'complaints.manage',
  'audit.read',
  'adminUsers.manage',
  'compliance.manage',
  'technicians.manage',
  'customers.manage',
] as const satisfies readonly Capability[];

export const ROLE_CAPABILITIES: Record<AdminRole, readonly Capability[]> = {
  'super-admin': ALL_CAPABILITIES,
  'ops-manager': [
    'liveOps.read',
    'orders.read',
    'orders.override',
    'catalogue.manage',
    'finance.read',
    'complaints.manage',
    'technicians.manage',
    'customers.manage',
  ],
  finance: ['finance.read'],
  'support-agent': [],
};

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  capability: Capability;
}

export const ADMIN_NAV_ITEMS = [
  { label: 'Live Ops',    href: '/dashboard',    icon: 'activity',               capability: 'liveOps.read' },
  { label: 'Orders',      href: '/orders',        icon: 'clipboard-list',         capability: 'orders.read' },
  { label: 'Catalogue',   href: '/catalogue',     icon: 'layout-grid',            capability: 'catalogue.manage' },
  { label: 'Finance',     href: '/finance',       icon: 'indian-rupee',           capability: 'finance.read' },
  { label: 'Complaints',  href: '/complaints',    icon: 'message-circle-warning', capability: 'complaints.manage' },
  { label: 'Audit Log',   href: '/audit-log',     icon: 'scroll-text',            capability: 'audit.read' },
  { label: 'Admin Users', href: '/admin-users',   icon: 'shield-user',            capability: 'adminUsers.manage' },
  { label: 'Compliance',  href: '/compliance',    icon: 'scale',                  capability: 'compliance.manage' },
  { label: 'Technicians', href: '/technicians',   icon: 'wrench',                 capability: 'technicians.manage' },
  { label: 'Customers',   href: '/customers',     icon: 'users-2',                capability: 'customers.manage' },
] as const satisfies readonly AdminNavItem[];

/**
 * hrefs that are hidden from the primary rail but remain directly linkable
 * (capability + route guard intact). Use this to declutter without losing
 * access — e.g., audit log is reached via deep links from other surfaces.
 */
export const PRIMARY_NAV_HIDDEN = new Set<string>(['/audit-log']);

interface RouteCapability {
  prefix: string;
  capability: Capability | null;
}

export const ADMIN_ROUTE_CAPABILITIES = [
  { prefix: '/not-authorized', capability: null },
  { prefix: '/dashboard', capability: 'liveOps.read' },
  { prefix: '/orders', capability: 'orders.read' },
  { prefix: '/catalogue', capability: 'catalogue.manage' },
  { prefix: '/finance', capability: 'finance.read' },
  { prefix: '/complaints', capability: 'complaints.manage' },
  { prefix: '/audit-log', capability: 'audit.read' },
  { prefix: '/admin-users', capability: 'adminUsers.manage' },
  { prefix: '/compliance', capability: 'compliance.manage' },
  { prefix: '/technicians', capability: 'technicians.manage' },
  { prefix: '/customers',   capability: 'customers.manage' },
] as const satisfies readonly RouteCapability[];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminRole(value: unknown): AdminRole | null {
  if (value === 'admin') return 'super-admin';
  return isAdminRole(value) ? value : null;
}

export function capabilitiesForRole(role: AdminRole | null | undefined): readonly Capability[] {
  if (!role) return [];
  return ROLE_CAPABILITIES[role] ?? [];
}

export function hasCapability(
  role: AdminRole | null | undefined,
  capability: Capability,
): boolean {
  return capabilitiesForRole(role).includes(capability);
}

export function hasAnyCapability(
  role: AdminRole | null | undefined,
  capabilities: readonly Capability[],
): boolean {
  return capabilities.some((capability) => hasCapability(role, capability));
}

export function hasAllCapabilities(
  role: AdminRole | null | undefined,
  capabilities: readonly Capability[],
): boolean {
  return capabilities.every((capability) => hasCapability(role, capability));
}

export function navItemsForRole(role: AdminRole | null | undefined): readonly AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter(
    (item) => hasCapability(role, item.capability) && !PRIMARY_NAV_HIDDEN.has(item.href),
  );
}

export function defaultPathForRole(role: AdminRole | null | undefined): string {
  return navItemsForRole(role)[0]?.href ?? '/not-authorized';
}

function routeMatches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function capabilityForPath(pathname: string): Capability | null | undefined {
  return ADMIN_ROUTE_CAPABILITIES.find((route) => routeMatches(pathname, route.prefix))
    ?.capability;
}

export function isKnownAdminPath(pathname: string): boolean {
  return capabilityForPath(pathname) !== undefined;
}

export function canAccessAdminPath(
  role: AdminRole | null | undefined,
  pathname: string,
): boolean {
  const capability = capabilityForPath(pathname);
  if (capability === undefined) return true;
  if (capability === null) return true;
  return hasCapability(role, capability);
}
