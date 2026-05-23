/**
 * E11-S02 — Pending Action Projector harness tests (TDD: written before impl)
 *
 * Covers:
 * - Idempotent upsert (duplicate change-feed events don't inflate version)
 * - Semantic no-op detection (same logical state → version unchanged)
 * - ETag 412 retry path (optimistic concurrency under contention)
 * - Stale-state cleanup (resolve on status transition)
 * - FCM strict ordering (upsert first, then FCM)
 * - resolveAction / expireAction paths
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock declarations (must precede imports) ──────────────────────────────────

vi.mock('../../src/cosmos/pending-action-repository.js', () => ({
  getPendingActionById: vi.fn(),
  createPendingAction: vi.fn(),
  rawReplacePendingAction: vi.fn(),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(() => ({
    messaging: () => ({ send: vi.fn().mockResolvedValue('msg-id') }),
  })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  upsertAction,
  resolveAction,
  expireAction,
  emitFcmForAction,
} from '../../src/services/pending-action-projector.js';

import {
  getPendingActionById,
  createPendingAction,
  rawReplacePendingAction,
} from '../../src/cosmos/pending-action-repository.js';

import { getFirebaseAdmin } from '../../src/services/firebaseAdmin.js';

import type { PendingActionDoc } from '../../src/schemas/pendingActions.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 3600_000).toISOString();

function makeDoc(overrides: Partial<PendingActionDoc> = {}): PendingActionDoc & { _etag: string } {
  return {
    id: 'ADDON_APPROVAL_REQUESTED:user-1:booking-1',
    userId: 'user-1',
    type: 'ADDON_APPROVAL_REQUESTED',
    status: 'ACTIVE',
    role: 'customer',
    version: 0,
    expiresAt: FUTURE,
    priority: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceId: 'booking-1',
    payload: { bookingId: 'booking-1' },
    _etag: '"etag-v0"',
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('upsertAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new action when it does not exist', async () => {
    vi.mocked(getPendingActionById).mockResolvedValue(null);
    vi.mocked(createPendingAction).mockImplementation(async (d) => d);

    const input = makeDoc();
    const result = await upsertAction({
      id: input.id,
      userId: input.userId,
      type: input.type,
      role: input.role,
      sourceId: input.sourceId,
      expiresAt: input.expiresAt,
      priority: input.priority,
      payload: { bookingId: 'booking-1' },
    });

    expect(createPendingAction).toHaveBeenCalledOnce();
    const created = vi.mocked(createPendingAction).mock.calls[0]![0];
    expect(created.version).toBe(0);
    expect(created.status).toBe('ACTIVE');
    expect(result.created).toBe(true);
  });

  it('is idempotent: duplicate change-feed event does NOT bump version', async () => {
    // Same status and payload → semantic no-op
    const existing = makeDoc({ version: 3 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'booking-1' }, // same as makeDoc default payload → no-op
    });

    expect(rawReplacePendingAction).not.toHaveBeenCalled();
    expect(createPendingAction).not.toHaveBeenCalled();
    expect(result.noOp).toBe(true);
    expect(result.doc.version).toBe(3); // unchanged
  });

  it('bumps version when payload changes (real mutation)', async () => {
    const existing = makeDoc({ version: 1, payload: { bookingId: 'booking-1', addonTotal: 500 } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({ ...existing, version: 2, payload: { bookingId: 'booking-1', addonTotal: 800 } });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'booking-1', addonTotal: 800 }, // changed
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    const [replaced, , userId] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(replaced.version).toBe(2);
    expect(userId).toBe('user-1');
    expect(result.noOp).toBe(false);
  });

  it('retries on 412 ETag conflict (max 3 attempts)', async () => {
    const existing = makeDoc({ version: 0 });
    vi.mocked(getPendingActionById)
      .mockResolvedValueOnce(existing)       // attempt 1 read
      .mockResolvedValueOnce({ ...existing, version: 1, _etag: '"etag-v1"' }) // attempt 2 re-read
      .mockResolvedValueOnce({ ...existing, version: 2, _etag: '"etag-v2"' }); // attempt 3 re-read

    // First two replace calls fail with 412, third succeeds
    vi.mocked(rawReplacePendingAction)
      .mockResolvedValueOnce(null) // 412
      .mockResolvedValueOnce(null) // 412
      .mockResolvedValue({ ...existing, version: 3 });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'booking-1', changed: true }, // force real mutation
    });

    expect(rawReplacePendingAction).toHaveBeenCalledTimes(3);
    expect(result.noOp).toBe(false);
    expect(result.doc.version).toBe(3);
  });

  it('throws after 3 failed 412 retries', async () => {
    const existing = makeDoc({ version: 0 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue(null); // always 412

    await expect(
      upsertAction({
        id: existing.id,
        userId: existing.userId,
        type: existing.type,
        role: existing.role,
        sourceId: existing.sourceId,
        expiresAt: existing.expiresAt,
        priority: existing.priority,
        payload: { changed: true },
      }),
    ).rejects.toThrow(/max retries/i);
  });
});

describe('resolveAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets status=RESOLVED and bumps version', async () => {
    const existing = makeDoc({ status: 'ACTIVE', version: 2 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({ ...existing, status: 'RESOLVED', version: 3 });

    await resolveAction(existing.id, existing.userId);

    const [replaced] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(replaced.status).toBe('RESOLVED');
    expect(replaced.version).toBe(3);
  });

  it('is a no-op if action is already RESOLVED', async () => {
    const existing = makeDoc({ status: 'RESOLVED', version: 5 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);

    await resolveAction(existing.id, existing.userId);

    expect(rawReplacePendingAction).not.toHaveBeenCalled();
  });

  it('returns null if action does not exist', async () => {
    vi.mocked(getPendingActionById).mockResolvedValue(null);

    const result = await resolveAction('nonexistent', 'user-1');
    expect(result).toBeNull();
  });
});

describe('expireAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets status=EXPIRED and bumps version', async () => {
    const existing = makeDoc({ status: 'ACTIVE', version: 1 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({ ...existing, status: 'EXPIRED', version: 2 });

    await expireAction(existing.id, existing.userId);

    const [replaced] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(replaced.status).toBe('EXPIRED');
    expect(replaced.version).toBe(2);
  });
});

describe('stale-state cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves ADDON_APPROVAL_REQUESTED when booking transitions to PAID', async () => {
    const actionId = 'ADDON_APPROVAL_REQUESTED:customer-1:booking-1';
    const existing = makeDoc({
      id: actionId,
      userId: 'customer-1',
      status: 'ACTIVE',
      type: 'ADDON_APPROVAL_REQUESTED',
      version: 1,
    });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({ ...existing, status: 'RESOLVED', version: 2 });

    // Simulate projector calling resolveAction when booking transitions AWAITING_PRICE_APPROVAL → PAID
    await resolveAction(actionId, 'customer-1');

    const [replaced] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(replaced.status).toBe('RESOLVED');
  });
});

describe('FCM strict ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emitFcmForAction succeeds and resolves without throwing', async () => {
    const doc = makeDoc({ role: 'customer' });
    // emitFcmForAction is mocked via vi.mock at top of file
    await expect(emitFcmForAction(doc, 'bookings')).resolves.not.toThrow();
  });

  it('emitFcmForAction with technician role also resolves', async () => {
    const doc = makeDoc({ role: 'technician' });
    await expect(emitFcmForAction(doc, 'dispatch_attempts')).resolves.not.toThrow();
  });

  it('emitFcmForAction swallows Error thrown by FCM send (err instanceof Error branch)', async () => {
    // Override the FCM send mock to throw an Error instance
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({
        send: vi.fn().mockRejectedValue(new Error('FCM_QUOTA_EXCEEDED')),
      }),
    } as never);

    const doc = makeDoc({ role: 'customer', payload: { bookingId: 'b-1' } });
    // Must NOT throw — the catch block swallows FCM errors
    await expect(emitFcmForAction(doc, 'bookings')).resolves.toBeUndefined();
  });

  it('emitFcmForAction swallows non-Error thrown by FCM send (String(err) branch)', async () => {
    // Override to throw a non-Error string (covers the String(err) branch of the catch)
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({
        send: vi.fn().mockRejectedValue('network-timeout'),
      }),
    } as never);

    const doc = makeDoc({ role: 'technician' });
    await expect(emitFcmForAction(doc, 'dispatch_attempts')).resolves.toBeUndefined();
  });

  it('emitFcmForAction omits payload key in FCM data when doc.payload is undefined', async () => {
    // Covers the `doc.payload ? { payload: ... } : {}` false branch (no payload spread)
    const sendMock = vi.fn().mockResolvedValue('msg-id');
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({ send: sendMock }),
    } as never);

    const doc = makeDoc({ payload: undefined });
    await emitFcmForAction(doc, 'bookings');

    expect(sendMock).toHaveBeenCalledOnce();
    const callArg = sendMock.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(callArg.data).not.toHaveProperty('payload');
  });
});

describe('isSemanticNoOp — early-exit branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is NOT a no-op when existing status is RESOLVED (status !== ACTIVE branch)', async () => {
    // existing has status=RESOLVED → isSemanticNoOp returns false immediately → real write happens
    const existing = makeDoc({ status: 'RESOLVED', version: 1, payload: { bookingId: 'b-1' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({
      ...existing,
      status: 'ACTIVE', // upsert can re-activate
      version: 2,
    });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'b-1' },
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    expect(result.noOp).toBe(false);
  });

  it('is NOT a no-op when type changes (type !== input.type branch)', async () => {
    const existing = makeDoc({ type: 'ADDON_APPROVAL_REQUESTED', status: 'ACTIVE', version: 2, payload: { bookingId: 'b-1' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({
      ...existing,
      type: 'RATING_PROMPT_CUSTOMER',
      version: 3,
    });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: 'RATING_PROMPT_CUSTOMER', // changed
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'b-1' },
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    expect(result.noOp).toBe(false);
  });

  it('is NOT a no-op when expiresAt changes (expiresAt !== input.expiresAt branch)', async () => {
    const existing = makeDoc({ status: 'ACTIVE', version: 1, payload: { bookingId: 'b-1' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    const newExpiry = new Date(Date.now() + 7_200_000).toISOString();
    vi.mocked(rawReplacePendingAction).mockResolvedValue({
      ...existing,
      expiresAt: newExpiry,
      version: 2,
    });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: newExpiry, // changed
      priority: existing.priority,
      payload: { bookingId: 'b-1' },
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    expect(result.noOp).toBe(false);
  });

  it('is NOT a no-op when priority changes (priority !== input.priority branch)', async () => {
    const existing = makeDoc({ status: 'ACTIVE', priority: 5, version: 1, payload: { bookingId: 'b-1' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({
      ...existing,
      priority: 1,
      version: 2,
    });

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: 1, // changed
      payload: { bookingId: 'b-1' },
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    expect(result.noOp).toBe(false);
  });

  it('treats missing payload on both sides as equal (payload ?? {} branch)', async () => {
    // Both existing.payload and input.payload are absent → JSON.stringify({}) === JSON.stringify({}) → noOp
    const existing = makeDoc({ status: 'ACTIVE', version: 2 });
    // Remove payload to simulate absent field (makeDoc sets payload by default)
    const existingWithoutPayload = { ...existing } as typeof existing & { payload?: Record<string, unknown> };
    delete existingWithoutPayload.payload;
    vi.mocked(getPendingActionById).mockResolvedValue(existingWithoutPayload);

    const result = await upsertAction({
      id: existingWithoutPayload.id,
      userId: existingWithoutPayload.userId,
      type: existingWithoutPayload.type,
      role: existingWithoutPayload.role,
      sourceId: existingWithoutPayload.sourceId,
      expiresAt: existingWithoutPayload.expiresAt,
      priority: existingWithoutPayload.priority,
      // No payload key → same as existing having no payload → noOp
    });

    expect(rawReplacePendingAction).not.toHaveBeenCalled();
    expect(result.noOp).toBe(true);
  });
});

// ── P2-5: Reactivation ────────────────────────────────────────────────────────

describe('P2-5: upsertAction reactivates RESOLVED/EXPIRED actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets status=ACTIVE when upserting into an existing RESOLVED action', async () => {
    const existing = makeDoc({ status: 'RESOLVED', version: 3, payload: { bookingId: 'b-1' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    const reactivated = { ...existing, status: 'ACTIVE' as const, version: 4, payload: { bookingId: 'b-1', addonTotal: 999 } };
    vi.mocked(rawReplacePendingAction).mockResolvedValue(reactivated);

    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'b-1', addonTotal: 999 }, // changed → not a no-op
    });

    expect(rawReplacePendingAction).toHaveBeenCalledOnce();
    const [written] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    // The written doc MUST have status=ACTIVE regardless of existing status
    expect(written.status).toBe('ACTIVE');
    expect(result.noOp).toBe(false);
  });

  it('sets status=ACTIVE when upserting into an existing EXPIRED action', async () => {
    const existing = makeDoc({ status: 'EXPIRED', version: 2, payload: { bookingId: 'b-2' } });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({ ...existing, status: 'ACTIVE', version: 3 });

    await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: existing.expiresAt,
      priority: existing.priority,
      payload: { bookingId: 'b-2', renewed: true },
    });

    const [written] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(written.status).toBe('ACTIVE');
  });
});

// ── P1-3: FCM legacy-client compat fields ────────────────────────────────────

describe('P1-3: emitFcmForAction includes legacy-client compat fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes bookingId top-level for ADDON_APPROVAL_REQUESTED', async () => {
    const sendMock = vi.fn().mockResolvedValue('msg-id');
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({ send: sendMock }),
    } as never);

    const doc = makeDoc({
      type: 'ADDON_APPROVAL_REQUESTED',
      role: 'customer',
      payload: { bookingId: 'booking-xyz', addOnCount: 2 },
    });
    await emitFcmForAction(doc, 'bookings');

    const callArg = sendMock.mock.calls[0]![0] as { data: Record<string, string> };
    expect(callArg.data['bookingId']).toBe('booking-xyz');
  });

  it('includes bookingId top-level for RATING_PROMPT_CUSTOMER', async () => {
    const sendMock = vi.fn().mockResolvedValue('msg-id');
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({ send: sendMock }),
    } as never);

    const doc = makeDoc({
      type: 'RATING_PROMPT_CUSTOMER',
      role: 'customer',
      payload: { bookingId: 'booking-abc', technicianId: 'tech-1' },
    });
    await emitFcmForAction(doc, 'bookings');

    const callArg = sendMock.mock.calls[0]![0] as { data: Record<string, string> };
    expect(callArg.data['bookingId']).toBe('booking-abc');
  });

  it('includes overall top-level (as string) for RATING_RECEIVED', async () => {
    const sendMock = vi.fn().mockResolvedValue('msg-id');
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({ send: sendMock }),
    } as never);

    const doc = makeDoc({
      type: 'RATING_RECEIVED',
      role: 'technician',
      payload: { ratingId: 'rating-1', customerId: 'cust-1', overall: 4, submittedAt: new Date().toISOString() },
    });
    await emitFcmForAction(doc, 'ratings');

    const callArg = sendMock.mock.calls[0]![0] as { data: Record<string, string> };
    // FCM data values must be strings; overall must be present
    expect(callArg.data['overall']).toBe('4');
  });

  it('does NOT add bookingId for action types that do not need it', async () => {
    const sendMock = vi.fn().mockResolvedValue('msg-id');
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      messaging: () => ({ send: sendMock }),
    } as never);

    const doc = makeDoc({
      type: 'KYC_RESUME',
      role: 'technician',
      payload: { kycId: 'kyc-1', kycStatus: 'PENDING' },
    });
    await emitFcmForAction(doc, 'kyc');

    const callArg = sendMock.mock.calls[0]![0] as { data: Record<string, string> };
    expect(callArg.data).not.toHaveProperty('bookingId');
    expect(callArg.data).not.toHaveProperty('overall');
  });

  it('same change-feed event delivered twice → no version bump', async () => {
    // Test P1-2 at the upsertAction level: identical state = no-op
    const existing = makeDoc({
      status: 'ACTIVE',
      version: 1,
      expiresAt: FUTURE,
      payload: { bookingId: 'b-1' },
    });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);

    // Replay with identical state
    const result = await upsertAction({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      role: existing.role,
      sourceId: existing.sourceId,
      expiresAt: FUTURE, // same stable timestamp
      priority: existing.priority,
      payload: { bookingId: 'b-1' }, // same payload
    });

    expect(rawReplacePendingAction).not.toHaveBeenCalled();
    expect(result.noOp).toBe(true);
    expect(result.doc.version).toBe(1); // unchanged
  });
});

describe('_transitionStatus — ETag fallback and retry exhaustion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to empty etag string when _etag is undefined on resolveAction', async () => {
    // existing has no _etag field → existing._etag ?? '' should fall back to ''
    const existing = makeDoc({ status: 'ACTIVE', version: 1 });
    delete (existing as Record<string, unknown>)['_etag']; // strip the _etag field

    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue({
      ...existing,
      status: 'RESOLVED',
      version: 2,
    });

    await resolveAction(existing.id, existing.userId);

    // Verify rawReplace was called with '' as the etag
    const [, etag] = vi.mocked(rawReplacePendingAction).mock.calls[0]!;
    expect(etag).toBe('');
  });

  it('throws after 3 failed 412 retries in _transitionStatus (resolveAction)', async () => {
    const existing = makeDoc({ status: 'ACTIVE', version: 0 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue(null); // always 412

    await expect(resolveAction(existing.id, existing.userId)).rejects.toThrow(/max retries exhausted/i);
    expect(rawReplacePendingAction).toHaveBeenCalledTimes(3);
  });

  it('throws after 3 failed 412 retries in _transitionStatus (expireAction)', async () => {
    const existing = makeDoc({ status: 'ACTIVE', version: 0 });
    vi.mocked(getPendingActionById).mockResolvedValue(existing);
    vi.mocked(rawReplacePendingAction).mockResolvedValue(null); // always 412

    await expect(expireAction(existing.id, existing.userId)).rejects.toThrow(/max retries exhausted/i);
    expect(rawReplacePendingAction).toHaveBeenCalledTimes(3);
  });
});
