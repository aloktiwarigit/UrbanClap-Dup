/**
 * E11-S02 Semgrep test fixture — BAD (inverted FCM ordering).
 *
 * This file intentionally calls emitFcmForAction BEFORE upsertAction.
 * The Semgrep rule `pending-action-fcm-ordering` MUST fire on this file.
 *
 * DO NOT import or execute this file in tests — it is a static analysis
 * fixture only.
 *
 * To verify the rule fires:
 *   cd api && npx semgrep --config .semgrep.yml tests/fixtures/trigger-projector-inverted-bad.ts
 * Expected: ERROR on pending-action-fcm-ordering rule
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

// Minimal stubs so the file parses
declare function emitFcmForAction(doc: unknown, source: string): Promise<void>;
declare function upsertAction(input: unknown): Promise<{ doc: unknown; noOp: boolean; created: boolean }>;

// ruleid: pending-action-fcm-ordering
async function badProjectorFunction(doc: Record<string, unknown>) {
  // WRONG ORDER: FCM before upsert — Semgrep should flag this
  await emitFcmForAction(doc, 'bad-source');
  const result = await upsertAction({ id: 'test', userId: 'user-1' });
  return result;
}
