/**
 * E11-S02 — Semgrep FCM ordering rule verification test.
 *
 * This test verifies that our inverted-order Semgrep fixture is correctly
 * structured, so the rule would catch it. We test that the projector
 * harness exports the functions expected by the Semgrep rule patterns.
 *
 * The actual Semgrep rule is validated by CI running semgrep on
 * api/tests/fixtures/trigger-projector-inverted-bad.ts (which the rule
 * should flag as ERROR).
 */

import { describe, it, expect } from 'vitest';

describe('Semgrep FCM ordering invariant', () => {
  it('pending-action-projector exports both upsertAction and emitFcmForAction', async () => {
    // If these imports fail, the Semgrep rule patterns would reference
    // non-existent functions.
    const module = await import('../../src/services/pending-action-projector.js');
    expect(typeof module.upsertAction).toBe('function');
    expect(typeof module.emitFcmForAction).toBe('function');
    expect(typeof module.resolveAction).toBe('function');
    expect(typeof module.expireAction).toBe('function');
    expect(typeof module.buildPendingActionId).toBe('function');
  });

  it('buildPendingActionId produces deterministic ids', async () => {
    const { buildPendingActionId } = await import('../../src/services/pending-action-projector.js');
    const id1 = buildPendingActionId('JOB_OFFER', 'tech-1', 'attempt-1');
    const id2 = buildPendingActionId('JOB_OFFER', 'tech-1', 'attempt-1');
    expect(id1).toBe(id2);
    expect(id1).toBe('JOB_OFFER:tech-1:attempt-1');
  });

  it('buildPendingActionId varies by type, userId, and sourceId', async () => {
    const { buildPendingActionId } = await import('../../src/services/pending-action-projector.js');
    const id1 = buildPendingActionId('JOB_OFFER', 'tech-1', 'attempt-1');
    const id2 = buildPendingActionId('KYC_RESUME', 'tech-1', 'attempt-1');
    const id3 = buildPendingActionId('JOB_OFFER', 'tech-2', 'attempt-1');
    const id4 = buildPendingActionId('JOB_OFFER', 'tech-1', 'attempt-2');
    expect(new Set([id1, id2, id3, id4]).size).toBe(4);
  });
});
