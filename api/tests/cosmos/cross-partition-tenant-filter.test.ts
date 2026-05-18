// E19-S03 — Cross-partition query caller-scope coverage test.
//
// Guards the RBAC contract described in docs/adr/0027-cross-partition-query-guardrails.md.
//
// The threat (I-A3 in docs/threat-model.md): a future endpoint that imports a
// cross-partition Cosmos helper and forwards user-controlled filters without first
// checking the caller's claim would expose other partitions' data.
//
// This test has three layers:
//   1. Semgrep-rule-presence — verifies both new rules are in api/.semgrep.yml so a botched
//      merge cannot silently drop them.
//   2. Caller-scope — reads api/src/functions/ recursively, finds every file that imports
//      one of the flagged cross-partition helpers, and asserts that each file also imports
//      at least one approved authentication middleware or is a system trigger function.
//   3. Repository-export invariant — verifies the SEMGREP-JUSTIFIED comment is present above
//      each cross-partition helper in the three repository files.
//
// Pattern: static file-scan only. No network, no Cosmos calls.
//
// See docs/adr/0027-cross-partition-query-guardrails.md.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(here, '..', '..');
const SEMGREP_PATH = resolve(API_ROOT, '.semgrep.yml');
const FUNCTIONS_ROOT = resolve(API_ROOT, 'src', 'functions');
const COSMOS_ROOT = resolve(API_ROOT, 'src', 'cosmos');

// ─── helpers ─────────────────────────────────────────────────────────────────

function readSrc(absPath: string): string {
  return readFileSync(absPath, 'utf8');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (st.isFile() && entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

function norm(p: string): string {
  return p.split(sep).join('/');
}

// ─── cross-partition helpers being guarded ───────────────────────────────────

// Import tokens that indicate a file calls a cross-partition helper.
const CROSS_PARTITION_IMPORT_TOKENS: ReadonlyArray<{ helper: string; importPattern: RegExp }> = [
  { helper: 'getRepeatOffenders',           importPattern: /\bgetRepeatOffenders\b/ },
  { helper: 'getOverdueComplaints',          importPattern: /\bgetOverdueComplaints\b/ },
  { helper: 'queryComplaints',               importPattern: /\bqueryComplaints\b/ },
  { helper: 'findRatingShieldEscalation',    importPattern: /\bfindRatingShieldEscalation\b/ },
  { helper: 'getUnacknowledgedPastDueComplaints', importPattern: /\bgetUnacknowledgedPastDueComplaints\b/ },
  { helper: 'queryAuditLog',                 importPattern: /\bqueryAuditLog\b/ },
  // ratingRepo.getAllByTechnicianId call-site (not just any ratingRepo import)
  { helper: 'ratingRepo.getAllByTechnicianId', importPattern: /ratingRepo\.getAllByTechnicianId\b/ },
];

// Approved authentication / scoping mechanisms:
//   requireAdmin / requireSuperAdmin — admin-only endpoints
//   requireCustomer — customer-scoped (uid from JWT claim, booking ownership checked)
//   verifyTechnicianToken — technician-scoped (uid from JWT claim)
//   app.timer — system cron trigger (no HTTP surface, no user input)
const APPROVED_SCOPE_TOKENS: ReadonlyArray<RegExp> = [
  /\brequireAdmin\b/,
  /\brequireSuperAdmin\b/,
  /\brequireCustomer\b/,
  /\bverifyTechnicianToken\b/,
  /\bapp\.timer\b/,
];

// ─── Layer 1: Semgrep rule presence ──────────────────────────────────────────

describe('Semgrep rule presence (E19-S03)', () => {
  const semgrepSrc = readSrc(SEMGREP_PATH);

  it('api/.semgrep.yml contains the no-user-controlled-cosmos-query rule id', () => {
    expect(semgrepSrc).toMatch(/^\s*-\s+id:\s+no-user-controlled-cosmos-query\s*$/m);
  });

  it('no-user-controlled-cosmos-query rule has ERROR severity', () => {
    // Extract the block after the rule id and check severity before the next rule id.
    const ruleStart = semgrepSrc.indexOf('id: no-user-controlled-cosmos-query');
    const nextRule = semgrepSrc.indexOf('\n  - id:', ruleStart + 1);
    const block = nextRule === -1
      ? semgrepSrc.slice(ruleStart)
      : semgrepSrc.slice(ruleStart, nextRule);
    expect(block).toMatch(/severity:\s+ERROR/);
  });

  it('api/.semgrep.yml contains the cross-partition-query-must-have-tenant-filter rule id', () => {
    expect(semgrepSrc).toMatch(/^\s*-\s+id:\s+cross-partition-query-must-have-tenant-filter\s*$/m);
  });

  it('cross-partition-query-must-have-tenant-filter rule has WARNING severity', () => {
    const ruleStart = semgrepSrc.indexOf('id: cross-partition-query-must-have-tenant-filter');
    const nextRule = semgrepSrc.indexOf('\n  - id:', ruleStart + 1);
    const block = nextRule === -1
      ? semgrepSrc.slice(ruleStart)
      : semgrepSrc.slice(ruleStart, nextRule);
    expect(block).toMatch(/severity:\s+WARNING/);
  });

  it('cross-partition-query-must-have-tenant-filter is scoped to the three repository files', () => {
    const ruleStart = semgrepSrc.indexOf('id: cross-partition-query-must-have-tenant-filter');
    const block = semgrepSrc.slice(ruleStart, ruleStart + 1500);
    expect(block).toMatch(/complaints-repository\.ts/);
    expect(block).toMatch(/audit-log-repository\.ts/);
    expect(block).toMatch(/rating-repository\.ts/);
  });
});

// ─── Layer 2: Caller-scope invariant ─────────────────────────────────────────

describe('Cross-partition helper callers have approved authentication scope', () => {
  const functionFiles = walk(FUNCTIONS_ROOT);

  for (const { helper, importPattern } of CROSS_PARTITION_IMPORT_TOKENS) {
    it(`every api/src/functions/ file importing ${helper} also has an approved scope token`, () => {
      const callers = functionFiles.filter((f) => importPattern.test(readSrc(f)));

      const violations: string[] = [];
      for (const caller of callers) {
        const src = readSrc(caller);
        const hasApprovedScope = APPROVED_SCOPE_TOKENS.some((re) => re.test(src));
        if (!hasApprovedScope) {
          violations.push(norm(caller));
        }
      }

      expect(
        violations,
        `Files importing ${helper} without an approved authentication scope:\n  ${violations.join('\n  ')}\n` +
        `Add requireAdmin/requireSuperAdmin/requireCustomer/verifyTechnicianToken middleware ` +
        `or use app.timer for system triggers. ` +
        `See docs/adr/0027-cross-partition-query-guardrails.md.`,
      ).toHaveLength(0);
    });
  }
});

// ─── Layer 3: SEMGREP-JUSTIFIED comment presence ─────────────────────────────

describe('SEMGREP-JUSTIFIED comments present on cross-partition helpers', () => {
  const JUSTIFIED_PATTERN = /\/\/\s*SEMGREP-JUSTIFIED:/;

  const FILES_AND_HELPERS: ReadonlyArray<{
    file: string;
    helpers: ReadonlyArray<string>;
  }> = [
    {
      file: resolve(COSMOS_ROOT, 'complaints-repository.ts'),
      helpers: [
        'queryComplaints',
        'getOverdueComplaints',
        'getRepeatOffenders',
        'findShieldByTechBooking',
        'countAppealsByTechInMonth',
        'findRatingShieldEscalation',
        'findComplaintByBookingAndParty',
        'queryComplaintsByBookingAndParty',
        'getUnacknowledgedPastDueComplaints',
      ],
    },
    {
      file: resolve(COSMOS_ROOT, 'audit-log-repository.ts'),
      helpers: ['queryAuditLog'],
    },
    {
      file: resolve(COSMOS_ROOT, 'rating-repository.ts'),
      helpers: ['getAllByTechnicianId'],
    },
  ];

  for (const { file, helpers } of FILES_AND_HELPERS) {
    const src = readSrc(file);
    const lines = src.split('\n');

    for (const helperName of helpers) {
      it(`${helperName} in ${norm(file).split('/').pop()} has a SEMGREP-JUSTIFIED comment above it`, () => {
        // Find the line index of the function/method declaration.
        const declIdx = lines.findIndex((l) => {
          // Match export async function NAME( or async NAME( inside object literal
          return new RegExp(`(export\\s+)?async\\s+(function\\s+)?${helperName}\\s*\\(`).test(l);
        });
        expect(
          declIdx,
          `Could not find declaration of ${helperName} in ${norm(file)}`,
        ).toBeGreaterThanOrEqual(0);

        // Check the preceding lines (up to 5) for a SEMGREP-JUSTIFIED comment.
        const lookBack = lines.slice(Math.max(0, declIdx - 5), declIdx).join('\n');
        expect(
          JUSTIFIED_PATTERN.test(lookBack),
          `No // SEMGREP-JUSTIFIED: comment found above ${helperName} in ${norm(file)}`,
        ).toBe(true);
      });
    }
  }
});
