/**
 * Karnataka Platform Workers Act 2025 — Data-layer isolation gate (FR-9.1, NFR-C-1).
 *
 * The dispatcher's read path (service + cosmos repos + schemas) must NEVER
 * reference decline-derived fields. This test scans the source files and the
 * Zod schema shapes to enforce the invariant at CI time, beyond the runtime
 * ranking-invariance test in dispatcher-up-ranking.test.ts.
 *
 * Companion enforcement layers:
 *   - api/.semgrep.yml — same rule at lint time.
 *   - docs/dispatch-algorithm.md — public-facing transparency doc.
 *   - docs/adr/0011-karnataka-decline-history-isolation.md — decision record.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TechnicianProfileSchema } from '../../src/schemas/technician.js';
import {
  DispatchAttemptStatusSchema,
  DispatchAttemptDocSchema,
} from '../../src/schemas/dispatch-attempt.js';

const here = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(here, '..', '..');

// Decline-derived identifiers forbidden in the dispatcher read path.
// `acceptRate` is mathematically equivalent to `1 - declineRate` and is
// therefore decline-derived even though positively framed.
const FORBIDDEN_TOKENS = [
  'declineCount',
  'declineHistory',
  'declineRatio',
  'declined_in_last',
  'rejectionCount',
  'rejectionHistory',
  'pastDeclines',
  'acceptRate',
  'acceptanceRate',
] as const;

const DISPATCHER_FILES = [
  'src/services/dispatcher.service.ts',
  'src/cosmos/technician-repository.ts',
  'src/cosmos/dispatch-attempt-repository.ts',
  'src/schemas/technician.ts',
  'src/schemas/dispatch-attempt.ts',
] as const;

function readApiFile(rel: string): string {
  return readFileSync(resolve(API_ROOT, rel), 'utf8');
}

describe('Karnataka FR-9.1 — Data-layer isolation', () => {
  it.each(DISPATCHER_FILES)(
    '%s contains no decline-derived identifiers',
    (file) => {
      const content = readApiFile(file).toLowerCase();
      for (const token of FORBIDDEN_TOKENS) {
        expect(
          content.includes(token.toLowerCase()),
          `${token} appears in ${file} — Karnataka FR-9.1 violation`,
        ).toBe(false);
      }
    },
  );

  it('TechnicianProfileSchema shape exposes no decline- or rejection-prefixed field', () => {
    const keys = Object.keys(TechnicianProfileSchema.shape).map((k) => k.toLowerCase());
    for (const k of keys) {
      expect(
        k.startsWith('decline'),
        `TechnicianProfileSchema field "${k}" starts with "decline"`,
      ).toBe(false);
      expect(
        k.startsWith('rejection'),
        `TechnicianProfileSchema field "${k}" starts with "rejection"`,
      ).toBe(false);
    }
  });

  it('DispatchAttemptStatusSchema enumerates exactly PENDING|ACCEPTED|EXPIRED', () => {
    // No 'DECLINED' / 'REJECTED' — those would imply per-tech decline tracking.
    // A tech who fails to accept within 30s causes the attempt to EXPIRE for
    // them, which is an attempt-level state, not a per-tech decline record.
    const values = [...DispatchAttemptStatusSchema.options].sort();
    expect(values).toEqual(['ACCEPTED', 'EXPIRED', 'PENDING']);
  });

  it('DispatchAttemptDocSchema shape has no decline-aggregation fields', () => {
    const keys = Object.keys(DispatchAttemptDocSchema.shape).map((k) => k.toLowerCase());
    for (const k of keys) {
      expect(
        k.startsWith('decline'),
        `DispatchAttemptDocSchema field "${k}" starts with "decline"`,
      ).toBe(false);
      expect(
        k.includes('rejection'),
        `DispatchAttemptDocSchema field "${k}" contains "rejection"`,
      ).toBe(false);
    }
  });
});
