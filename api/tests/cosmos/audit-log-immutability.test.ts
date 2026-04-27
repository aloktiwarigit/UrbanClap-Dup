// Audit-log immutability defensive test (FR-9.4, DPDP Act §8, RBI retention).
//
// Locks the `audit_log` Cosmos container to APPEND-ONLY semantics across
// four layers enforced in this test file (a fifth layer — Cosmos RBAC —
// is documented as deferred in docs/adr/0013-audit-log-immutability.md):
//
//   1. Module surface — repository exports exactly { appendAuditEntry, queryAuditLog }
//   2. File-scan — repository + service contain no mutation/deletion tokens
//   3. Container-name uniqueness — only the repository file references the literal 'audit_log'
//   4. Semgrep-rule-presence — api/.semgrep.yml contains the audit-log-immutable rule
//
// The Semgrep-rule-presence assertion (4) protects against a botched merge
// that drops the rule from .semgrep.yml — without it, the merge with
// feature/E10-S01-karnataka-compliance could silently lose Layer 4 enforcement.
//
// Pattern: file-scan + module introspection. No Cosmos calls.
//
// See docs/adr/0013-audit-log-immutability.md.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as auditLogRepo from '../../src/cosmos/audit-log-repository.js';
import { AuditLogEntrySchema } from '../../src/schemas/audit-log.js';

const here = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(here, '..', '..');
const REPO_PATH = resolve(API_ROOT, 'src', 'cosmos', 'audit-log-repository.ts');
const SERVICE_PATH = resolve(API_ROOT, 'src', 'services', 'auditLog.service.ts');
const SEMGREP_PATH = resolve(API_ROOT, '.semgrep.yml');
const SRC_ROOT = resolve(API_ROOT, 'src');

// Forbidden tokens — any of these in the repository or service source means
// a future PR has introduced an audit-log mutation/deletion path. Identifier
// regexes use `\w*` (zero-or-more) between the verb and `Audit` so that
// `updateAuditEntry`, `deleteAuditEntry`, `mutateAuditEntry`,
// `updateUserAuditLog`, `deletePiiAuditRecord` etc. all match. Case-insensitive
// for defence against macro-generated/serialized identifiers.
//
// `.batch(`, `.bulk(`, `.executeBulkOperations(` are included because the
// Cosmos SDK's batch APIs accept `operationType: 'Delete' | 'Replace' | 'Upsert'`
// in their input array — using them would bypass the more obvious
// `.delete()` / `.replace()` / `.upsert()` patterns.
const FORBIDDEN_TOKENS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: '.replace(', pattern: /\.replace\s*\(/i },
  { name: '.delete(', pattern: /\.delete\s*\(/i },
  { name: '.upsert(', pattern: /\.upsert\s*\(/i },
  { name: '.patch(', pattern: /\.patch\s*\(/i },
  // Cosmos batch / bulk APIs — accept operationType: 'Delete'/'Replace'/'Upsert'
  // in their input array, escaping the per-method patterns above.
  { name: '.batch(', pattern: /\.batch\s*\(/i },
  { name: '.bulk(', pattern: /\.bulk\s*\(/i },
  { name: '.executeBulkOperations(', pattern: /\.executeBulkOperations\s*\(/i },
  // Identifier patterns — function names that mutate or delete audit entries.
  // Pattern: <verb>\w*Audit\w* — zero-or-more chars between verb and Audit so
  // that `updateAuditEntry`, `deleteAuditRow`, `mutateAuditPayload`, and
  // also `updateUserAuditLog`, `deletePiiAuditRecord` all match.
  { name: 'update*Audit*', pattern: /\bupdate\w*Audit\w*\b/i },
  { name: 'delete*Audit*', pattern: /\bdelete\w*Audit\w*\b/i },
  { name: 'mutate*Audit*', pattern: /\bmutate\w*Audit\w*\b/i },
];

describe('audit-log-repository.ts: module surface invariant', () => {
  it('exports exactly { appendAuditEntry, queryAuditLog } — no mutation/deletion methods', () => {
    const exports = Object.keys(auditLogRepo)
      .filter((k) => k !== 'default' && !k.startsWith('__'))
      .sort();
    expect(exports).toEqual(['appendAuditEntry', 'queryAuditLog']);
  });

  it('appendAuditEntry is a function', () => {
    expect(typeof auditLogRepo.appendAuditEntry).toBe('function');
  });

  it('queryAuditLog is a function', () => {
    expect(typeof auditLogRepo.queryAuditLog).toBe('function');
  });
});

describe('FORBIDDEN_TOKENS: positive + negative controls', () => {
  // Validate the regexes themselves so a future PR that "fixes" them by
  // narrowing the pattern silently (and lets through `updateAuditEntry`)
  // fails at this layer first.
  const POSITIVE_CASES: ReadonlyArray<{ token: string; identifier: string }> = [
    { token: 'update*Audit*', identifier: 'updateAuditEntry' },
    { token: 'update*Audit*', identifier: 'updateUserAuditLog' },
    { token: 'delete*Audit*', identifier: 'deleteAuditEntry' },
    { token: 'delete*Audit*', identifier: 'deletePiiAuditRecord' },
    { token: 'mutate*Audit*', identifier: 'mutateAuditEntry' },
  ];
  const NEGATIVE_CASES: ReadonlyArray<{ token: string; identifier: string }> = [
    // Words that contain the verb-prefix or `audit` substring but should NOT
    // match — defence against over-broad regex.
    { token: 'update*Audit*', identifier: 'updateProfile' },
    { token: 'delete*Audit*', identifier: 'deleteSession' },
    { token: 'mutate*Audit*', identifier: 'mutateState' },
  ];

  it.each(POSITIVE_CASES)(
    '$token regex matches $identifier (positive control)',
    ({ token, identifier }) => {
      const entry = FORBIDDEN_TOKENS.find((t) => t.name === token);
      expect(entry).toBeDefined();
      expect(entry!.pattern.test(identifier)).toBe(true);
    },
  );

  it.each(NEGATIVE_CASES)(
    '$token regex does NOT match $identifier (negative control)',
    ({ token, identifier }) => {
      const entry = FORBIDDEN_TOKENS.find((t) => t.name === token);
      expect(entry).toBeDefined();
      expect(entry!.pattern.test(identifier)).toBe(false);
    },
  );
});

describe('audit-log-repository.ts: file-scan invariant', () => {
  const source = readFileSync(REPO_PATH, 'utf8');

  it.each(FORBIDDEN_TOKENS)(
    'source contains no $name (would mutate or delete an audit entry)',
    ({ pattern }) => {
      expect(source).not.toMatch(pattern);
    },
  );

  it('source contains exactly one .create( call (the append) and no others', () => {
    const matches = source.match(/\.create\s*\(/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('source still contains the canonical append + query exports', () => {
    expect(source).toMatch(/export\s+async\s+function\s+appendAuditEntry\s*\(/);
    expect(source).toMatch(/export\s+async\s+function\s+queryAuditLog\s*\(/);
  });
});

describe('auditLog.service.ts: file-scan invariant', () => {
  const source = readFileSync(SERVICE_PATH, 'utf8');

  it.each(FORBIDDEN_TOKENS)(
    'service source contains no $name',
    ({ pattern }) => {
      expect(source).not.toMatch(pattern);
    },
  );

  it('service uses appendAuditEntry exclusively (no direct .container() access)', () => {
    expect(source).toMatch(/appendAuditEntry/);
    expect(source).not.toMatch(/\.container\s*\(\s*['"]audit_log['"]\s*\)/);
  });
});

describe('container-name uniqueness invariant', () => {
  // Only `audit-log-repository.ts` may reference the literal 'audit_log'
  // container name. Any other file referencing it is an immutability bypass
  // (e.g. an admin handler reading via a different code path that could
  // later add .replace/.delete without going through the repository).

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

  it('exactly one source file references the audit_log container literal', () => {
    const files = walk(SRC_ROOT);
    const refs = files.filter((f) =>
      /['"]audit_log['"]/.test(readFileSync(f, 'utf8')),
    );
    const norm = (p: string) => p.split(sep).join('/');
    // Use both length and equality assertions so the failure message is
    // diagnostic ("found 0 / found 2" vs sorted-array equality).
    expect(refs).toHaveLength(1);
    expect(norm(refs[0]!)).toBe(norm(REPO_PATH));
  });
});

describe('Semgrep-rule-presence invariant', () => {
  // Protects against a botched merge that silently drops the
  // `audit-log-immutable` rule from api/.semgrep.yml. Without this guard a
  // merge conflict resolution that takes "ours" (the karnataka rule) over
  // "theirs" (this rule) — or vice versa — would lose Layer 4 enforcement
  // with no test catching it.

  const semgrepSource = readFileSync(SEMGREP_PATH, 'utf8');

  it('api/.semgrep.yml contains the audit-log-immutable rule id', () => {
    expect(semgrepSource).toMatch(/^\s*-\s+id:\s+audit-log-immutable\s*$/m);
  });

  it('rule blocks mutation patterns on the audit_log container', () => {
    // Each forbidden pattern must appear at least once in the rule body.
    const requiredPatterns = [
      'audit_log".*items.upsert',
      'audit_log".*items.replace',
      'audit_log".*items.delete',
      'audit_log".*items.batch',
      'audit_log".*items.bulk',
      'audit_log".*items.executeBulkOperations',
    ];
    for (const p of requiredPatterns) {
      expect(semgrepSource).toMatch(new RegExp(p));
    }
  });
});

describe('AuditLogEntrySchema: contract regression guard', () => {
  // NOT an immutability invariant — these tests protect against accidental
  // schema regressions so that consumers (Cosmos write path, admin UI read
  // path) don't break silently. Kept in this file because the schema
  // shape directly affects what the immutability layers protect.
  //
  // The `action` field is currently `z.string()` (free-form). Tightening
  // to `z.enum([...])` is tracked as Future work item 2 in
  // docs/adr/0013-audit-log-immutability.md and depends on W2-2 audit-log
  // P1 bundle stabilising the action vocabulary.

  it('schema rejects entries missing required fields (id, timestamp)', () => {
    expect(() =>
      AuditLogEntrySchema.parse({
        adminId: 'a',
        role: 'system',
        action: 'x',
        resourceType: 'r',
        resourceId: 'r1',
        payload: {},
        // missing id, timestamp
      }),
    ).toThrow();
  });

  it('schema accepts a well-formed entry (regression guard for parse contract)', () => {
    const parsed = AuditLogEntrySchema.parse({
      id: '00000000-0000-0000-0000-000000000001',
      adminId: 'a',
      role: 'system',
      action: 'arbitrary_action',
      resourceType: 'r',
      resourceId: 'r1',
      payload: {},
      timestamp: '2026-04-27T00:00:00.000Z',
    });
    expect(parsed.id).toBe('00000000-0000-0000-0000-000000000001');
  });
});
