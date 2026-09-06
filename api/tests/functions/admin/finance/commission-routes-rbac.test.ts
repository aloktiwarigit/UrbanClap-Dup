import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';

/**
 * Registration-level RBAC audit (E21-S02 Task 10 fix round). This does NOT invoke any handler —
 * it only imports the four commission-ledger admin route modules for their side-effecting
 * `app.http(...)` calls and asserts each registration carries the exact roles the spec pins down,
 * `authLevel: 'anonymous'` (auth is enforced by `requireAdmin`, not the Functions host), and that
 * every handler is actually `requireAdmin`-wrapped (never a bare handler that skips the gate).
 */
const { httpMock, requireAdminMock } = vi.hoisted(() => {
  const requireAdminMock = vi.fn(
    (roles: string[]) =>
      (handler: (...args: unknown[]) => unknown): { __roles: string[] } & typeof handler =>
        Object.assign(handler, { __roles: roles }),
  );
  return { httpMock: vi.fn(), requireAdminMock };
});

vi.mock('@azure/functions', () => ({
  app: { http: httpMock },
}));

vi.mock('../../../../src/middleware/requireAdmin.js', () => ({
  requireAdmin: requireAdminMock,
}));

import '../../../../src/functions/admin/finance/commission-remittances.js';
import '../../../../src/functions/admin/finance/commission-receivables.js';
import '../../../../src/functions/admin/finance/commission-hold-override.js';
import '../../../../src/functions/admin/finance/mark-commission-received.js';

interface CapturedRegistration {
  name: string;
  methods: string[] | undefined;
  route: string | undefined;
  authLevel: string | undefined;
  handler: { __roles?: string[] };
}

function registrations(): CapturedRegistration[] {
  return httpMock.mock.calls.map(([name, opts]) => {
    const options = opts as { methods?: string[]; route?: string; authLevel?: string; handler: unknown };
    return {
      name: name as string,
      methods: options.methods,
      route: options.route,
      authLevel: options.authLevel,
      handler: options.handler as { __roles?: string[] },
    };
  });
}

function findRegistration(name: string): CapturedRegistration {
  const reg = registrations().find((r) => r.name === name);
  if (!reg) throw new Error(`no app.http registration found for "${name}"`);
  return reg;
}

describe('admin finance commission-ledger route RBAC registration', () => {
  it('registers all seven expected routes', () => {
    const names = registrations().map((r) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'recordCommissionRemittance',
        'adminCommissionReceivablesDashboard',
        'adminCommissionReceivablesPerTech',
        'adminCommissionReceivablesRecompute',
        'setCommissionHoldOverride',
        'clearCommissionHoldOverride',
        'markCommissionReceived',
      ]),
    );
  });

  it('every registration uses authLevel "anonymous" and a requireAdmin-wrapped handler', () => {
    const regs = registrations();
    expect(regs.length).toBeGreaterThanOrEqual(7);
    for (const r of regs) {
      expect(r.authLevel).toBe('anonymous');
      expect(r.handler.__roles).toBeDefined();
    }
  });

  it.each<[string, string[]]>([
    ['recordCommissionRemittance', ['super-admin', 'finance']],
    ['adminCommissionReceivablesDashboard', ['super-admin', 'finance', 'ops-manager']],
    ['adminCommissionReceivablesPerTech', ['super-admin', 'finance', 'ops-manager']],
    ['adminCommissionReceivablesRecompute', ['super-admin']],
    ['setCommissionHoldOverride', ['super-admin']],
    ['clearCommissionHoldOverride', ['super-admin']],
    ['markCommissionReceived', ['super-admin', 'finance']],
  ])('%s is gated to exactly %j', (name, roles) => {
    expect(findRegistration(name).handler.__roles).toEqual(roles);
  });
});
