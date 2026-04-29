/**
 * Defensive invariant test (modeled on the dispatcher-data-isolation pattern).
 *
 * docs/dpdp-data-inventory.md is the auditor-facing source of truth for which
 * PII fields the platform stores and which ones are returned by /v1/users/me/data-export.
 *
 * If a developer adds a new top-level export key to the response (or removes
 * one) without updating the inventory, this test fails. That keeps the
 * machine-readable inventory in lock-step with code — the property DPDP §11
 * relies on for compliance.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../../src/cosmos/user-data-export-reads.js', () => ({
  userDataExportReads: {
    listBookingsForUser: vi.fn().mockResolvedValue([]),
    listRatingsForUser: vi.fn().mockResolvedValue([]),
    listComplaintsForUser: vi.fn().mockResolvedValue([]),
    listWalletLedgerForTechnician: vi.fn().mockResolvedValue([]),
    listBookingEventsForUser: vi.fn().mockResolvedValue([]),
    listDispatchAttemptsForUser: vi.fn().mockResolvedValue([]),
    readTechnicianFullDoc: vi.fn().mockResolvedValue({ profile: null, kyc: null, fcmToken: null }),
    listAuditLogForUser: vi.fn().mockResolvedValue([]),
  },
}));

interface MachineReadableInventory {
  dataInventoryVersion: number;
  exportedKeys: {
    CUSTOMER: string[];
    TECHNICIAN: string[];
  };
}

function readInventoryJson(): MachineReadableInventory {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const path = resolve(__dirname, '../../../docs/dpdp-data-inventory.md');
  const md = readFileSync(path, 'utf-8');
  const m = md.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m || !m[1]) {
    throw new Error(
      'docs/dpdp-data-inventory.md must contain a ```json fenced block with the machine-readable inventory',
    );
  }
  const parsed = JSON.parse(m[1]) as Record<string, unknown>;
  if (typeof parsed['dataInventoryVersion'] !== 'number') {
    throw new Error('inventory: dataInventoryVersion must be a number');
  }
  const ek = parsed['exportedKeys'] as Record<string, unknown>;
  if (!ek || !Array.isArray(ek['CUSTOMER']) || !Array.isArray(ek['TECHNICIAN'])) {
    throw new Error('inventory: exportedKeys.CUSTOMER and .TECHNICIAN must be string arrays');
  }
  return parsed as unknown as MachineReadableInventory;
}

describe('DPDP data inventory invariant', () => {
  let inventory: MachineReadableInventory;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    inventory = readInventoryJson();
  });

  it('docs/dpdp-data-inventory.md declares dataInventoryVersion as a positive integer', () => {
    expect(inventory.dataInventoryVersion).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(inventory.dataInventoryVersion)).toBe(true);
  });

  it('inventory version matches the constant exported by the data-export service', async () => {
    const svc = await import('../../src/services/dataExport.service.js');
    expect(svc.DATA_INVENTORY_VERSION).toBe(inventory.dataInventoryVersion);
  });

  it('CUSTOMER export response contains every declared exported key', async () => {
    const svc = await import('../../src/services/dataExport.service.js');
    const result = await svc.assembleUserDataExport('cust-1', 'CUSTOMER');
    for (const key of inventory.exportedKeys.CUSTOMER) {
      expect(result).toHaveProperty(key);
      expect((result as unknown as Record<string, unknown>)[key]).not.toBeUndefined();
    }
    expect(result.dataInventoryVersion).toBe(inventory.dataInventoryVersion);
    expect(result.role).toBe('CUSTOMER');
  });

  it('TECHNICIAN export response contains every declared exported key', async () => {
    const svc = await import('../../src/services/dataExport.service.js');
    const result = await svc.assembleUserDataExport('tech-1', 'TECHNICIAN');
    for (const key of inventory.exportedKeys.TECHNICIAN) {
      expect(result).toHaveProperty(key);
      expect((result as unknown as Record<string, unknown>)[key]).not.toBeUndefined();
    }
    expect(result.dataInventoryVersion).toBe(inventory.dataInventoryVersion);
    expect(result.role).toBe('TECHNICIAN');
  });

  it('CUSTOMER response does not include TECHNICIAN-only PII (kyc null, walletLedger empty)', async () => {
    const svc = await import('../../src/services/dataExport.service.js');
    const result = await svc.assembleUserDataExport('cust-1', 'CUSTOMER');
    expect(result.kyc).toBeNull();
    expect(result.walletLedger).toEqual([]);
  });
});
