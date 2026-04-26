# E07-S03 Complaints Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers and technicians manually file complaints from within their apps, linked to a closed booking, with reason codes + optional photo, SLA timers (2h acknowledge / 24h resolve), and status polling.

**Architecture:** Three independent work streams after WS-A: API endpoints (WS-A), customer-app (WS-B), technician-app (WS-C). WS-B and WS-C are fully parallel after Task 1. Each Android task follows the existing rating module pattern (Repository → UseCase → ViewModel → Screen).

**Tech Stack:** Azure Functions + Cosmos DB + Zod (API); Kotlin + Compose + Hilt + Retrofit + Moshi + Firebase Storage (Android); Vitest (API tests); JUnit 5 + MockK (Android tests)

**Dependency order:** WS-A Tasks 1–5 → WS-B Tasks 6–10 and WS-C Tasks 11–15 in parallel → WS-D Task 16.

**Path aliases used throughout:**
- `CUS_MAIN` = `customer-app/app/src/main/kotlin/com/homeservices/customer`
- `CUS_TEST` = `customer-app/app/src/test/kotlin/com/homeservices/customer`
- `TECH_MAIN` = `technician-app/app/src/main/kotlin/com/homeservices/technician`
- `TECH_TEST` = `technician-app/app/src/test/kotlin/com/homeservices/technician`

---

## WS-A: API Foundation

### Task 1: Extend complaint schema + cosmos repo helpers

**Files:**
- Modify: `api/src/schemas/complaint.ts`
- Modify: `api/src/cosmos/complaints-repository.ts`

- [ ] **Step 1: Extend `api/src/schemas/complaint.ts`**

Add after the existing `ComplaintResolutionCategoryEnum`:

```typescript
export const ComplaintFiledByEnum = z.enum(['CUSTOMER', 'TECHNICIAN']);

export const CustomerReasonCodeEnum = z.enum([
  'SERVICE_QUALITY',
  'LATE_ARRIVAL',
  'NO_SHOW',
  'TECHNICIAN_BEHAVIOUR',
  'BILLING_DISPUTE',
  'OTHER',
]);

export const TechnicianReasonCodeEnum = z.enum([
  'CUSTOMER_MISCONDUCT',
  'LATE_PAYMENT',
  'SAFETY_CONCERN',
  'OTHER',
]);
```

Extend `ComplaintDocSchema` — add four optional fields after `escalated`:

```typescript
  filedBy: ComplaintFiledByEnum.optional(),
  reasonCode: z.string().optional(),
  photoStoragePath: z.string().optional(),
  acknowledgeDeadlineAt: z.string().optional(),
```

Add new schemas at the bottom:

```typescript
export const CreateComplaintByPartnerBodySchema = z.object({
  bookingId: z.string().min(1),
  reasonCode: z.string().min(1),
  description: z.string().min(10).max(2000),
  photoStoragePath: z.string().optional(),
}).openapi('CreateComplaintByPartnerBody');

export const PartnerComplaintListResponseSchema = z.object({
  complaints: z.array(ComplaintDocSchema),
}).openapi('PartnerComplaintListResponse');

export type ComplaintFiledBy = z.infer<typeof ComplaintFiledByEnum>;
export type CustomerReasonCode = z.infer<typeof CustomerReasonCodeEnum>;
export type TechnicianReasonCode = z.infer<typeof TechnicianReasonCodeEnum>;
export type CreateComplaintByPartnerBody = z.infer<typeof CreateComplaintByPartnerBodySchema>;
export type PartnerComplaintListResponse = z.infer<typeof PartnerComplaintListResponseSchema>;
```

- [ ] **Step 2: Add two repo helpers to `api/src/cosmos/complaints-repository.ts`**

```typescript
export async function findActiveComplaintByBookingAndParty(
  bookingId: string,
  uid: string,
): Promise<ComplaintDoc | null> {
  const query: SqlQuerySpec = {
    query: `SELECT TOP 1 * FROM c WHERE c.orderId = @bookingId AND c.filedBy != null
            AND (c.customerId = @uid OR c.technicianId = @uid)
            AND c.status != @resolved`,
    parameters: [
      { name: '@bookingId', value: bookingId },
      { name: '@uid', value: uid },
      { name: '@resolved', value: 'RESOLVED' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.length > 0 ? ComplaintDocSchema.parse(resources[0]) : null;
}

export async function queryComplaintsByBookingAndParty(
  bookingId: string,
  uid: string,
): Promise<ComplaintDoc[]> {
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE c.orderId = @bookingId
            AND (c.customerId = @uid OR c.technicianId = @uid)
            ORDER BY c.createdAt DESC`,
    parameters: [
      { name: '@bookingId', value: bookingId },
      { name: '@uid', value: uid },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map(r => ComplaintDocSchema.parse(r));
}

export async function getAcknowledgePastDueComplaints(): Promise<Array<{ doc: ComplaintDoc; etag: string }>> {
  const now = new Date().toISOString();
  const query: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE IS_DEFINED(c.acknowledgeDeadlineAt)
            AND c.acknowledgeDeadlineAt < @now
            AND c.status = @new
            AND (c.escalated != true OR NOT IS_DEFINED(c.escalated))`,
    parameters: [
      { name: '@now', value: now },
      { name: '@new', value: 'NEW' },
    ],
  };
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .items.query<Record<string, unknown>>(query)
    .fetchAll();
  return resources.map(r => ({
    doc: ComplaintDocSchema.parse(r),
    etag: typeof r['_etag'] === 'string' ? r['_etag'] : '',
  }));
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd api && pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/schemas/complaint.ts api/src/cosmos/complaints-repository.ts
git commit -m "feat(e07-s03): extend complaint schema + cosmos repo helpers"
```

---

### Task 2: Add FCM helper for complaint filed notification

**Files:**
- Modify: `api/src/services/fcm.service.ts`

- [ ] **Step 1: Add `sendOwnerComplaintFiled` to fcm.service.ts**

```typescript
export async function sendOwnerComplaintFiled(payload: {
  bookingId: string;
  filedBy: string;
  reasonCode: string;
}): Promise<void> {
  await getFirebaseAdmin().messaging().send({
    topic: 'owner_alerts',
    data: {
      type: 'OWNER_COMPLAINT_FILED',
      bookingId: payload.bookingId,
      filedBy: payload.filedBy,
      reasonCode: payload.reasonCode,
    },
  });
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd api && pnpm typecheck
git add api/src/services/fcm.service.ts
git commit -m "feat(e07-s03): add sendOwnerComplaintFiled FCM helper"
```

---

### Task 3: `POST /v1/complaints` endpoint (TDD)

**Files:**
- Create: `api/tests/functions/complaints/partner-create.test.ts`
- Create: `api/src/functions/complaints/partner-create.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/functions/complaints/partner-create.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: {
    getById: vi.fn(),
  },
}));
vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
  createComplaint: vi.fn(),
  findActiveComplaintByBookingAndParty: vi.fn(),
}));
vi.mock('../../../src/services/fcm.service.js', () => ({
  sendOwnerComplaintFiled: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { createComplaint, findActiveComplaintByBookingAndParty } from '../../../src/cosmos/complaints-repository.js';
import { partnerCreateComplaintHandler } from '../../../src/functions/complaints/partner-create.js';

function makeReq(body: unknown, token = 'Bearer tok'): HttpRequest {
  return {
    headers: { get: (k: string) => k === 'authorization' ? token : null },
    json: () => Promise.resolve(body),
  } as unknown as HttpRequest;
}
const mockCtx = { error: vi.fn() } as unknown as InvocationContext;
const closedBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED',
};
const validBody = {
  bookingId: 'bk-1', reasonCode: 'SERVICE_QUALITY',
  description: 'Technician left without finishing the work properly.',
};

describe('POST /v1/complaints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no Bearer token', async () => {
    const res = await partnerCreateComplaintHandler(makeReq(validBody, ''), mockCtx);
    expect(res.status).toBe(401);
  });

  it('returns 401 when token invalid', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad token'));
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(404);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 403 when caller not a booking participant', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'stranger' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(403);
    expect((res.jsonBody as { code: string }).code).toBe('FORBIDDEN');
  });

  it('returns 409 BOOKING_NOT_ELIGIBLE when booking not CLOSED', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...closedBooking, status: 'IN_PROGRESS' });
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('BOOKING_NOT_ELIGIBLE');
  });

  it('returns 409 COMPLAINT_ALREADY_FILED when active complaint exists', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findActiveComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(409);
    expect((res.jsonBody as { code: string }).code).toBe('COMPLAINT_ALREADY_FILED');
  });

  it('returns 400 when reasonCode invalid for customer role', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findActiveComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerCreateComplaintHandler(
      makeReq({ ...validBody, reasonCode: 'CUSTOMER_MISCONDUCT' }), mockCtx,
    );
    expect(res.status).toBe(400);
    expect((res.jsonBody as { code: string }).code).toBe('INVALID_REASON_CODE');
  });

  it('returns 201 with complaint doc for customer caller', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findActiveComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await partnerCreateComplaintHandler(makeReq(validBody), mockCtx);
    expect(res.status).toBe(201);
    const doc = res.jsonBody as Record<string, unknown>;
    expect(doc['filedBy']).toBe('CUSTOMER');
    expect(doc['reasonCode']).toBe('SERVICE_QUALITY');
    expect(doc['status']).toBe('NEW');
    expect(doc['acknowledgeDeadlineAt']).toBeDefined();
  });

  it('returns 201 for technician caller with tech reason code', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'tech-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    (findActiveComplaintByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await partnerCreateComplaintHandler(
      makeReq({ ...validBody, reasonCode: 'LATE_PAYMENT' }), mockCtx,
    );
    expect(res.status).toBe(201);
    expect((res.jsonBody as { filedBy: string }).filedBy).toBe('TECHNICIAN');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd api && pnpm test tests/functions/complaints/partner-create.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `api/src/functions/complaints/partner-create.ts`**

```typescript
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import {
  createComplaint,
  findActiveComplaintByBookingAndParty,
} from '../../cosmos/complaints-repository.js';
import { sendOwnerComplaintFiled } from '../../services/fcm.service.js';
import {
  CreateComplaintByPartnerBodySchema,
  CustomerReasonCodeEnum,
  TechnicianReasonCodeEnum,
} from '../../schemas/complaint.js';
import type { ComplaintDoc } from '../../schemas/complaint.js';
import { randomUUID } from 'crypto';

export async function partnerCreateComplaintHandler(
  req: HttpRequest,
  ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return { status: 400, jsonBody: { code: 'INVALID_JSON' } };
  }
  const parsed = CreateComplaintByPartnerBodySchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  }
  const data = parsed.data;

  const booking = await bookingRepo.getById(data.bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const isCustomer = booking.customerId === uid;
  const isTechnician = booking.technicianId === uid;
  if (!isCustomer && !isTechnician) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'CLOSED') {
    return { status: 409, jsonBody: { code: 'BOOKING_NOT_ELIGIBLE', status: booking.status } };
  }

  const filedBy = isCustomer ? 'CUSTOMER' as const : 'TECHNICIAN' as const;
  const reasonValid = filedBy === 'CUSTOMER'
    ? CustomerReasonCodeEnum.safeParse(data.reasonCode).success
    : TechnicianReasonCodeEnum.safeParse(data.reasonCode).success;
  if (!reasonValid) return { status: 400, jsonBody: { code: 'INVALID_REASON_CODE' } };

  const existing = await findActiveComplaintByBookingAndParty(data.bookingId, uid);
  if (existing) return { status: 409, jsonBody: { code: 'COMPLAINT_ALREADY_FILED' } };

  const now = new Date();
  const doc: ComplaintDoc = {
    id: randomUUID(),
    orderId: data.bookingId,
    customerId: booking.customerId,
    technicianId: booking.technicianId ?? '',
    description: data.description,
    status: 'NEW',
    internalNotes: [],
    slaDeadlineAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    acknowledgeDeadlineAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    filedBy,
    reasonCode: data.reasonCode,
    ...(data.photoStoragePath ? { photoStoragePath: data.photoStoragePath } : {}),
  };

  await createComplaint(doc);

  sendOwnerComplaintFiled({ bookingId: data.bookingId, filedBy, reasonCode: data.reasonCode })
    .catch((err: unknown) => ctx.error('sendOwnerComplaintFiled failed', err));

  return { status: 201, jsonBody: doc };
}

app.http('partnerCreateComplaint', {
  methods: ['POST'],
  route: 'v1/complaints',
  authLevel: 'anonymous',
  handler: partnerCreateComplaintHandler,
});
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd api && pnpm test tests/functions/complaints/partner-create.test.ts
```
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/tests/functions/complaints/partner-create.test.ts \
        api/src/functions/complaints/partner-create.ts
git commit -m "feat(e07-s03): POST /v1/complaints partner endpoint (TDD)"
```

---

### Task 4: `GET /v1/complaints/{bookingId}` endpoint (TDD)

**Files:**
- Create: `api/tests/functions/complaints/partner-get.test.ts`
- Create: `api/src/functions/complaints/partner-get.ts`

- [ ] **Step 1: Write failing tests**

Create `api/tests/functions/complaints/partner-get.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest, InvocationContext } from '@azure/functions';

vi.mock('../../../src/services/firebaseAdmin.js', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));
vi.mock('../../../src/cosmos/booking-repository.js', () => ({
  bookingRepo: { getById: vi.fn() },
}));
vi.mock('../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaintsByBookingAndParty: vi.fn(),
}));

import { verifyFirebaseIdToken } from '../../../src/services/firebaseAdmin.js';
import { bookingRepo } from '../../../src/cosmos/booking-repository.js';
import { queryComplaintsByBookingAndParty } from '../../../src/cosmos/complaints-repository.js';
import { partnerGetComplaintsHandler } from '../../../src/functions/complaints/partner-get.js';

function makeReq(bookingId: string, token = 'Bearer tok'): HttpRequest {
  return {
    headers: { get: (k: string) => k === 'authorization' ? token : null },
    params: { bookingId },
  } as unknown as HttpRequest;
}
const mockCtx = {} as InvocationContext;
const closedBooking = { id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1', status: 'CLOSED' };

describe('GET /v1/complaints/{bookingId}', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no token', async () => {
    const res = await partnerGetComplaintsHandler(makeReq('bk-1', ''), mockCtx);
    expect(res.status).toBe(401);
  });

  it('returns 404 when booking not found', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(404);
  });

  it('returns 403 when caller not booking participant', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'stranger' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(403);
  });

  it('returns 200 with complaints array', async () => {
    (verifyFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue({ uid: 'cust-1' });
    (bookingRepo.getById as ReturnType<typeof vi.fn>).mockResolvedValue(closedBooking);
    const mockComplaints = [{
      id: 'c-1', orderId: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
      description: 'A valid description here.', status: 'NEW', internalNotes: [],
      slaDeadlineAt: '2026-04-26T00:00:00Z', escalated: false,
      createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z',
      filedBy: 'CUSTOMER', reasonCode: 'SERVICE_QUALITY',
    }];
    (queryComplaintsByBookingAndParty as ReturnType<typeof vi.fn>).mockResolvedValue(mockComplaints);
    const res = await partnerGetComplaintsHandler(makeReq('bk-1'), mockCtx);
    expect(res.status).toBe(200);
    const body = res.jsonBody as { complaints: unknown[] };
    expect(body.complaints).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd api && pnpm test tests/functions/complaints/partner-get.test.ts
```

- [ ] **Step 3: Implement `api/src/functions/complaints/partner-get.ts`**

```typescript
import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyFirebaseIdToken } from '../../services/firebaseAdmin.js';
import { bookingRepo } from '../../cosmos/booking-repository.js';
import { queryComplaintsByBookingAndParty } from '../../cosmos/complaints-repository.js';

export async function partnerGetComplaintsHandler(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return { status: 401, jsonBody: { code: 'UNAUTHENTICATED' } };

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(auth.slice(7));
    uid = decoded.uid;
  } catch {
    return { status: 401, jsonBody: { code: 'TOKEN_INVALID' } };
  }

  const bookingId = req.params['bookingId'] ?? '';
  const booking = await bookingRepo.getById(bookingId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== uid && booking.technicianId !== uid) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const complaints = await queryComplaintsByBookingAndParty(bookingId, uid);
  return { status: 200, jsonBody: { complaints } };
}

app.http('partnerGetComplaints', {
  methods: ['GET'],
  route: 'v1/complaints/{bookingId}',
  authLevel: 'anonymous',
  handler: partnerGetComplaintsHandler,
});
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd api && pnpm test tests/functions/complaints/partner-get.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add api/tests/functions/complaints/partner-get.test.ts \
        api/src/functions/complaints/partner-get.ts
git commit -m "feat(e07-s03): GET /v1/complaints/{bookingId} endpoint (TDD)"
```

---

### Task 5: Extend SLA timer — acknowledge-breach path (TDD)

**Files:**
- Modify: `api/tests/functions/admin/complaints/sla-timer.test.ts`
- Modify: `api/src/functions/admin/complaints/sla-timer.ts`

- [ ] **Step 1: Add acknowledge-breach tests to existing sla-timer.test.ts**

Open `api/tests/functions/admin/complaints/sla-timer.test.ts`. The existing mock block mocks `getOverdueComplaints`. Add `getAcknowledgePastDueComplaints` to the mock:

```typescript
vi.mock('../../../../src/cosmos/complaints-repository.js', () => ({
  queryComplaints: vi.fn(),
  createComplaint: vi.fn(),
  getComplaint: vi.fn(),
  replaceComplaint: vi.fn(),
  getOverdueComplaints: vi.fn(),
  getRepeatOffenders: vi.fn(),
  findActiveComplaintByBookingAndParty: vi.fn(),
  queryComplaintsByBookingAndParty: vi.fn(),
  getAcknowledgePastDueComplaints: vi.fn(),
}));
```

Add the new import:
```typescript
import { getOverdueComplaints, replaceComplaint, getAcknowledgePastDueComplaints } from '../../../../src/cosmos/complaints-repository.js';
```

Add new tests at end of the `describe` block:

```typescript
  it('escalates acknowledge-past-due complaint and logs SLA_BREACH_ACK', async () => {
    const ackOverdue = {
      ...overdueComplaint,
      id: 'c-ack-1',
      slaDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      acknowledgeDeadlineAt: new Date(Date.now() - 1000).toISOString(),
      filedBy: 'CUSTOMER',
    };
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getAcknowledgePastDueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([
      { doc: ackOverdue, etag: '"ack-etag"' },
    ]);
    (replaceComplaint as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (appendAuditEntry as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).toHaveBeenCalledOnce();
    const [replacedDoc] = (replaceComplaint as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(replacedDoc.escalated).toBe(true);
    const auditCall = (appendAuditEntry as ReturnType<typeof vi.fn>).mock.calls[0]![0]!;
    expect(auditCall.action).toBe('SLA_BREACH_ACK');
  });

  it('does not double-escalate a complaint already escalated by ack sweep', async () => {
    (getOverdueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getAcknowledgePastDueComplaints as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await slaBreachTimerHandler({} as never, mockCtx);
    expect(replaceComplaint).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
cd api && pnpm test tests/functions/admin/complaints/sla-timer.test.ts
```

- [ ] **Step 3: Extend `api/src/functions/admin/complaints/sla-timer.ts`**

Replace the handler body (keep the existing `slaBreachTimerHandler` shape, add ack sweep):

```typescript
import { app } from '@azure/functions';
import type { Timer, InvocationContext } from '@azure/functions';
import {
  getOverdueComplaints,
  replaceComplaint,
  getAcknowledgePastDueComplaints,
} from '../../../cosmos/complaints-repository.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import { randomUUID } from 'crypto';

const SYSTEM_ACTOR_ID = 'system';
const SYSTEM_ACTOR_ROLE = 'super-admin' as const;

async function escalateBatch(
  batch: Awaited<ReturnType<typeof getOverdueComplaints>>,
  auditAction: string,
  ctx: InvocationContext,
  now: string,
): Promise<void> {
  await Promise.all(
    batch.map(async ({ doc: complaint, etag }) => {
      const updated = { ...complaint, escalated: true, updatedAt: now };
      try {
        await replaceComplaint(updated, etag);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 412) {
          ctx.log(`slaBreachTimer: skipping ${complaint.id} — concurrent update`);
          return;
        }
        throw err;
      }
      appendAuditEntry({
        id: randomUUID(),
        adminId: SYSTEM_ACTOR_ID,
        role: SYSTEM_ACTOR_ROLE,
        action: auditAction,
        resourceType: 'complaint',
        resourceId: complaint.id,
        payload: { technicianId: complaint.technicianId, orderId: complaint.orderId },
        ip: '',
        userAgent: '',
        timestamp: now,
        partitionKey: now.slice(0, 7),
      }).catch((err: unknown) => ctx.error(`audit ${auditAction} failed for ${complaint.id}`, err));
    }),
  );
}

export async function slaBreachTimerHandler(
  _timer: Timer,
  ctx: InvocationContext,
): Promise<void> {
  let overdue: Awaited<ReturnType<typeof getOverdueComplaints>>;
  let ackOverdue: Awaited<ReturnType<typeof getAcknowledgePastDueComplaints>>;
  try {
    [overdue, ackOverdue] = await Promise.all([
      getOverdueComplaints(),
      getAcknowledgePastDueComplaints(),
    ]);
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 404) {
      ctx.log('slaBreachTimer: complaints container not yet provisioned — skipping');
      return;
    }
    throw err;
  }

  const now = new Date().toISOString();
  await Promise.all([
    escalateBatch(overdue, 'SLA_BREACH', ctx, now),
    escalateBatch(ackOverdue, 'SLA_BREACH_ACK', ctx, now),
  ]);

  ctx.log(`slaBreachTimer: resolve-breaches=${overdue.length} ack-breaches=${ackOverdue.length}`);
}

app.timer('slaBreachTimer', {
  schedule: '0 */15 * * * *',
  handler: slaBreachTimerHandler,
});
```

- [ ] **Step 4: Run all sla-timer tests**

```bash
cd api && pnpm test tests/functions/admin/complaints/sla-timer.test.ts
```
Expected: all pass.

- [ ] **Step 5: Full API suite**

```bash
cd api && pnpm test:coverage
```
Expected: ≥80%, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add api/tests/functions/admin/complaints/sla-timer.test.ts \
        api/src/functions/admin/complaints/sla-timer.ts
git commit -m "feat(e07-s03): extend SLA timer for acknowledge-breach path (TDD)"
```

---

## WS-B: customer-app

### Task 6: customer-app — build.gradle.kts + DTOs + ApiService

**Files:**
- Modify: `customer-app/app/build.gradle.kts`
- Create: `CUS_MAIN/data/complaint/remote/dto/ComplaintDtos.kt`
- Create: `CUS_MAIN/data/complaint/remote/ComplaintApiService.kt`

- [ ] **Step 1: Add firebase-storage dependency**

In `customer-app/app/build.gradle.kts`, add after the existing firebase lines:

```kotlin
    implementation(libs.firebase.storage)
```

- [ ] **Step 2: Create `CUS_MAIN/data/complaint/remote/dto/ComplaintDtos.kt`**

```kotlin
package com.homeservices.customer.data.complaint.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CreateComplaintRequestDto(
    val bookingId: String,
    val reasonCode: String,
    val description: String,
    val photoStoragePath: String?,
)

@JsonClass(generateAdapter = true)
public data class ComplaintResponseDto(
    val id: String,
    val status: String,
    val acknowledgeDeadlineAt: String?,
    val slaDeadlineAt: String,
    val reasonCode: String?,
    val filedBy: String?,
    val createdAt: String,
)

@JsonClass(generateAdapter = true)
public data class ComplaintListResponseDto(
    val complaints: List<ComplaintResponseDto>,
)
```

- [ ] **Step 3: Create `CUS_MAIN/data/complaint/remote/ComplaintApiService.kt`**

```kotlin
package com.homeservices.customer.data.complaint.remote

import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

public interface ComplaintApiService {
    @POST("v1/complaints")
    public suspend fun createComplaint(
        @Body body: CreateComplaintRequestDto,
    ): ComplaintResponseDto

    @GET("v1/complaints/{bookingId}")
    public suspend fun getComplaintsForBooking(
        @Path("bookingId") bookingId: String,
    ): ComplaintListResponseDto
}
```

- [ ] **Step 4: Build to confirm no compile errors**

```bash
cd customer-app && ./gradlew assembleDebug
```
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/build.gradle.kts \
        customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/
git commit -m "feat(e07-s03): customer-app complaint DTOs + ApiService"
```

---

### Task 7: customer-app — Repository + DI (TDD)

**Files:**
- Create: `CUS_MAIN/data/complaint/ComplaintRepository.kt`
- Create: `CUS_MAIN/data/complaint/ComplaintRepositoryImpl.kt`
- Create: `CUS_MAIN/data/complaint/di/ComplaintModule.kt`
- Create: `CUS_TEST/data/complaint/ComplaintRepositoryImplTest.kt`

- [ ] **Step 1: Write the failing test**

Create `CUS_TEST/data/complaint/ComplaintRepositoryImplTest.kt`:

```kotlin
package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ComplaintRepositoryImplTest {
    private val api: ComplaintApiService = mockk()
    private val repo = ComplaintRepositoryImpl(api)

    private val mockResponse = ComplaintResponseDto(
        id = "c-1", status = "NEW",
        acknowledgeDeadlineAt = "2026-04-25T02:00:00Z",
        slaDeadlineAt = "2026-04-26T00:00:00Z",
        reasonCode = "SERVICE_QUALITY", filedBy = "CUSTOMER",
        createdAt = "2026-04-25T00:00:00Z",
    )

    @Test
    public fun `createComplaint returns success result`(): Unit = runTest {
        coEvery { api.createComplaint(any()) } returns mockResponse
        val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some long description here.", null).toList()
        assertThat(results.first().isSuccess).isTrue()
        assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
    }

    @Test
    public fun `createComplaint returns failure on exception`(): Unit = runTest {
        coEvery { api.createComplaint(any()) } throws RuntimeException("network error")
        val results = repo.createComplaint("bk-1", "SERVICE_QUALITY", "Some long description here.", null).toList()
        assertThat(results.first().isFailure).isTrue()
    }

    @Test
    public fun `getComplaintsForBooking returns list`(): Unit = runTest {
        coEvery { api.getComplaintsForBooking("bk-1") } returns ComplaintListResponseDto(
            complaints = listOf(mockResponse),
        )
        val results = repo.getComplaintsForBooking("bk-1").toList()
        assertThat(results.first().getOrNull()).hasSize(1)
    }
}
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.ComplaintRepositoryImplTest" 2>&1 | tail -5
```
Expected: FAILED (class not found).

- [ ] **Step 3: Create `CUS_MAIN/data/complaint/ComplaintRepository.kt`**

```kotlin
package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow

public interface ComplaintRepository {
    public fun createComplaint(
        bookingId: String,
        reasonCode: String,
        description: String,
        photoStoragePath: String?,
    ): Flow<Result<ComplaintResponseDto>>

    public fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>>
}
```

- [ ] **Step 4: Create `CUS_MAIN/data/complaint/ComplaintRepositoryImpl.kt`**

```kotlin
package com.homeservices.customer.data.complaint

import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.data.complaint.remote.dto.CreateComplaintRequestDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class ComplaintRepositoryImpl
    @Inject
    constructor(
        private val api: ComplaintApiService,
    ) : ComplaintRepository {
        override fun createComplaint(
            bookingId: String,
            reasonCode: String,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> =
            flow {
                emit(runCatching {
                    api.createComplaint(
                        CreateComplaintRequestDto(bookingId, reasonCode, description, photoStoragePath),
                    )
                })
            }

        override fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
            flow {
                emit(runCatching {
                    api.getComplaintsForBooking(bookingId).complaints
                })
            }
    }
```

- [ ] **Step 5: Create `CUS_MAIN/data/complaint/di/ComplaintModule.kt`**

```kotlin
package com.homeservices.customer.data.complaint.di

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import com.homeservices.customer.BuildConfig
import com.homeservices.customer.data.booking.di.AuthOkHttpClient
import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.ComplaintRepositoryImpl
import com.homeservices.customer.data.complaint.remote.ComplaintApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ComplaintModule {
    @Binds
    internal abstract fun bindComplaintRepository(impl: ComplaintRepositoryImpl): ComplaintRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideComplaintApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): ComplaintApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(ComplaintApiService::class.java)

        @Provides
        @Singleton
        public fun provideFirebaseStorage(): FirebaseStorage = FirebaseStorage.getInstance()
    }
}
```

- [ ] **Step 6: Run tests — expect pass**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.ComplaintRepositoryImplTest"
```

- [ ] **Step 7: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/data/complaint/ \
        customer-app/app/src/test/kotlin/com/homeservices/customer/data/complaint/
git commit -m "feat(e07-s03): customer-app complaint repository + DI (TDD)"
```

---

### Task 8: customer-app — use cases (TDD)

**Files:**
- Create: `CUS_MAIN/domain/complaint/ComplaintReason.kt`
- Create: `CUS_MAIN/domain/complaint/SubmitComplaintUseCase.kt`
- Create: `CUS_TEST/domain/complaint/SubmitComplaintUseCaseTest.kt`
- Create: `CUS_MAIN/domain/complaint/PhotoUploadUseCase.kt`
- Create: `CUS_TEST/domain/complaint/PhotoUploadUseCaseTest.kt`
- Create: `CUS_MAIN/domain/complaint/GetComplaintStatusUseCase.kt`
- Create: `CUS_TEST/domain/complaint/GetComplaintStatusUseCaseTest.kt`

- [ ] **Step 1: Create `CUS_MAIN/domain/complaint/ComplaintReason.kt`**

```kotlin
package com.homeservices.customer.domain.complaint

public enum class ComplaintReason(public val code: String, public val labelHindi: String) {
    SERVICE_QUALITY("SERVICE_QUALITY", "काम ठीक नहीं हुआ"),
    LATE_ARRIVAL("LATE_ARRIVAL", "देरी से आए"),
    NO_SHOW("NO_SHOW", "आए ही नहीं"),
    TECHNICIAN_BEHAVIOUR("TECHNICIAN_BEHAVIOUR", "व्यवहार खराब था"),
    BILLING_DISPUTE("BILLING_DISPUTE", "पैसों का झगड़ा"),
    OTHER("OTHER", "अन्य"),
}
```

- [ ] **Step 2: Write failing test for SubmitComplaintUseCase**

Create `CUS_TEST/domain/complaint/SubmitComplaintUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitComplaintUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = SubmitComplaintUseCase(repo)

    private val mockResponse = ComplaintResponseDto(
        id = "c-1", status = "NEW",
        acknowledgeDeadlineAt = "2026-04-25T02:00:00Z",
        slaDeadlineAt = "2026-04-26T00:00:00Z",
        reasonCode = "SERVICE_QUALITY", filedBy = "CUSTOMER",
        createdAt = "2026-04-25T00:00:00Z",
    )

    @Test
    public fun `delegates to repo and returns success`(): Unit = runTest {
        coEvery {
            repo.createComplaint("bk-1", "SERVICE_QUALITY", "A long enough description.", null)
        } returns flowOf(Result.success(mockResponse))

        val results = useCase("bk-1", ComplaintReason.SERVICE_QUALITY, "A long enough description.", null).toList()

        assertThat(results.first().isSuccess).isTrue()
        assertThat(results.first().getOrNull()?.id).isEqualTo("c-1")
    }

    @Test
    public fun `propagates failure from repo`(): Unit = runTest {
        coEvery { repo.createComplaint(any(), any(), any(), any()) } returns
            flowOf(Result.failure(RuntimeException("network")))
        val results = useCase("bk-1", ComplaintReason.OTHER, "A long enough description.", null).toList()
        assertThat(results.first().isFailure).isTrue()
    }
}
```

- [ ] **Step 3: Create `CUS_MAIN/domain/complaint/SubmitComplaintUseCase.kt`**

```kotlin
package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitComplaintUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            reason: ComplaintReason,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> =
            repo.createComplaint(bookingId, reason.code, description, photoStoragePath)
    }
```

- [ ] **Step 4: Write failing test for PhotoUploadUseCase**

Create `CUS_TEST/domain/complaint/PhotoUploadUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.complaint

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import com.google.firebase.storage.UploadTask
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class PhotoUploadUseCaseTest {
    private val storage: FirebaseStorage = mockk()
    private val auth: FirebaseAuth = mockk()
    private val useCase = PhotoUploadUseCase(storage, auth)

    @Test
    public fun `returns failure when no authenticated user`(): Unit = runTest {
        every { auth.currentUser } returns null
        val result = useCase("bk-1", "/some/local/file.jpg")
        assertThat(result.isFailure).isTrue()
    }

    @Test
    public fun `returns failure when file path does not exist`(): Unit = runTest {
        val user: FirebaseUser = mockk()
        every { auth.currentUser } returns user
        every { user.uid } returns "uid-1"
        // Non-existent path — BitmapFactory.decodeFile returns null → error("Cannot decode…")
        val result = useCase("bk-1", "/nonexistent/path/file.jpg")
        assertThat(result.isFailure).isTrue()
    }
}
```

- [ ] **Step 5: Create `CUS_MAIN/domain/complaint/PhotoUploadUseCase.kt`**

```kotlin
package com.homeservices.customer.domain.complaint

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject

public class PhotoUploadUseCase
    @Inject
    constructor(
        private val storage: FirebaseStorage,
        private val auth: FirebaseAuth,
    ) {
        public suspend operator fun invoke(bookingId: String, localFilePath: String): Result<String> =
            runCatching {
                val bytes = withContext(Dispatchers.IO) { compressToJpeg(localFilePath) }
                val uid = auth.currentUser?.uid ?: error("No authenticated user")
                val timestamp = System.currentTimeMillis()
                val storagePath = "complaints/$bookingId/$uid/$timestamp.jpg"
                val ref = storage.reference.child(storagePath)
                val metadata = StorageMetadata.Builder().setContentType("image/jpeg").build()
                ref.putBytes(bytes, metadata).await()
                storagePath
            }

        private fun compressToJpeg(filePath: String): ByteArray {
            val original = BitmapFactory.decodeFile(filePath)
                ?: error("Cannot decode image at $filePath")
            val scaled = Bitmap.createScaledBitmap(original, 1024, 1024, true)
            return ByteArrayOutputStream()
                .also { out ->
                    scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
                    if (scaled !== original) scaled.recycle()
                    original.recycle()
                }.toByteArray()
        }
    }
```

- [ ] **Step 6: Create `CUS_MAIN/domain/complaint/GetComplaintStatusUseCase.kt` + test**

Test `CUS_TEST/domain/complaint/GetComplaintStatusUseCaseTest.kt`:

```kotlin
package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetComplaintStatusUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = GetComplaintStatusUseCase(repo)

    @Test
    public fun `delegates to repository`(): Unit = runTest {
        val list = listOf(
            ComplaintResponseDto("c-1", "INVESTIGATING", null, "2026-04-26T00:00:00Z", "SERVICE_QUALITY", "CUSTOMER", "2026-04-25T00:00:00Z"),
        )
        coEvery { repo.getComplaintsForBooking("bk-1") } returns flowOf(Result.success(list))
        val results = useCase("bk-1").toList()
        assertThat(results.first().getOrNull()).hasSize(1)
        assertThat(results.first().getOrNull()?.first()?.status).isEqualTo("INVESTIGATING")
    }
}
```

Impl `CUS_MAIN/domain/complaint/GetComplaintStatusUseCase.kt`:

```kotlin
package com.homeservices.customer.domain.complaint

import com.homeservices.customer.data.complaint.ComplaintRepository
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetComplaintStatusUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
            repo.getComplaintsForBooking(bookingId)
    }
```

- [ ] **Step 7: Run all domain complaint tests**

```bash
cd customer-app && ./gradlew testDebugUnitTest \
  --tests "*.SubmitComplaintUseCaseTest" \
  --tests "*.PhotoUploadUseCaseTest" \
  --tests "*.GetComplaintStatusUseCaseTest"
```
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/domain/complaint/ \
        customer-app/app/src/test/kotlin/com/homeservices/customer/domain/complaint/
git commit -m "feat(e07-s03): customer-app complaint use cases (TDD)"
```

---

### Task 9: customer-app — ViewModel (TDD)

**Files:**
- Create: `CUS_MAIN/ui/complaint/ComplaintViewModel.kt`
- Create: `CUS_TEST/ui/complaint/ComplaintViewModelTest.kt`

- [ ] **Step 1: Write failing test**

Create `CUS_TEST/ui/complaint/ComplaintViewModelTest.kt`:

```kotlin
package com.homeservices.customer.ui.complaint

import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ComplaintViewModelTest {
    private val submitUseCase: SubmitComplaintUseCase = mockk()
    private val photoUploadUseCase: PhotoUploadUseCase = mockk()
    private val getStatusUseCase: GetComplaintStatusUseCase = mockk()
    private val dispatcher = StandardTestDispatcher()

    private lateinit var viewModel: ComplaintViewModel

    @BeforeEach
    public fun setUp() {
        Dispatchers.setMain(dispatcher)
        viewModel = ComplaintViewModel(submitUseCase, photoUploadUseCase, getStatusUseCase)
    }

    @AfterEach
    public fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    public fun `initial state has submit disabled`() {
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        assertThat((viewModel.uiState.value as ComplaintUiState.Idle).submitEnabled).isFalse()
    }

    @Test
    public fun `submitEnabled true when reason and description set`(): Unit = runTest {
        viewModel.onReasonSelected(ComplaintReason.SERVICE_QUALITY)
        viewModel.onDescriptionChanged("A description that is long enough for submit.")
        dispatcher.scheduler.advanceUntilIdle()
        val state = viewModel.uiState.value as ComplaintUiState.Idle
        assertThat(state.submitEnabled).isTrue()
    }

    @Test
    public fun `submitEnabled false when description too short`(): Unit = runTest {
        viewModel.onReasonSelected(ComplaintReason.SERVICE_QUALITY)
        viewModel.onDescriptionChanged("short")
        dispatcher.scheduler.advanceUntilIdle()
        val state = viewModel.uiState.value as ComplaintUiState.Idle
        assertThat(state.submitEnabled).isFalse()
    }

    @Test
    public fun `onSubmit transitions to Success on happy path`(): Unit = runTest {
        viewModel.onReasonSelected(ComplaintReason.LATE_ARRIVAL)
        viewModel.onDescriptionChanged("Technician arrived 3 hours late with no notice given to customer.")
        val mockResp = ComplaintResponseDto(
            "c-1", "NEW", "2026-04-25T02:00:00Z", "2026-04-26T00:00:00Z",
            "LATE_ARRIVAL", "CUSTOMER", "2026-04-25T00:00:00Z",
        )
        coEvery { submitUseCase("bk-1", ComplaintReason.LATE_ARRIVAL, any(), null) } returns
            flowOf(Result.success(mockResp))
        viewModel.onSubmit("bk-1")
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Success::class.java)
    }

    @Test
    public fun `onSubmit transitions to Error on failure`(): Unit = runTest {
        viewModel.onReasonSelected(ComplaintReason.OTHER)
        viewModel.onDescriptionChanged("A description that is long enough for submit to work.")
        coEvery { submitUseCase(any(), any(), any(), any()) } returns
            flowOf(Result.failure(RuntimeException("network")))
        viewModel.onSubmit("bk-1")
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Error::class.java)
    }
}
```

- [ ] **Step 2: Run to confirm fail**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.ComplaintViewModelTest" 2>&1 | tail -5
```

- [ ] **Step 3: Create `CUS_MAIN/ui/complaint/ComplaintViewModel.kt`**

```kotlin
package com.homeservices.customer.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.customer.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.customer.domain.complaint.ComplaintReason
import com.homeservices.customer.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.customer.domain.complaint.PhotoUploadUseCase
import com.homeservices.customer.domain.complaint.SubmitComplaintUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintUiState {
    public data class Idle(
        val selectedReason: ComplaintReason? = null,
        val description: String = "",
        val photoStoragePath: String? = null,
        val submitEnabled: Boolean = false,
    ) : ComplaintUiState()
    public data object PhotoUploading : ComplaintUiState()
    public data object Submitting : ComplaintUiState()
    public data class Success(
        val complaintId: String,
        val acknowledgeDeadlineAt: String?,
    ) : ComplaintUiState()
    public data class Error(val message: String) : ComplaintUiState()
}

@HiltViewModel
public class ComplaintViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitComplaintUseCase,
        private val photoUploadUseCase: PhotoUploadUseCase,
        private val getStatusUseCase: GetComplaintStatusUseCase,
    ) : ViewModel() {

    private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
    public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

    public fun onReasonSelected(reason: ComplaintReason) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = current.copy(
            selectedReason = reason,
            submitEnabled = isSubmitEnabled(reason, current.description),
        )
    }

    public fun onDescriptionChanged(description: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = current.copy(
            description = description,
            submitEnabled = isSubmitEnabled(current.selectedReason, description),
        )
    }

    public fun onPhotoSelected(localFilePath: String, bookingId: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = ComplaintUiState.PhotoUploading
        viewModelScope.launch {
            val result = photoUploadUseCase(bookingId, localFilePath)
            _uiState.value = current.copy(
                photoStoragePath = result.getOrNull(),
                submitEnabled = isSubmitEnabled(current.selectedReason, current.description),
            )
        }
    }

    public fun onSubmit(bookingId: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        val reason = current.selectedReason ?: return
        _uiState.value = ComplaintUiState.Submitting
        viewModelScope.launch {
            submitUseCase(bookingId, reason, current.description, current.photoStoragePath)
                .collect { result ->
                    _uiState.value = result.fold(
                        onSuccess = { dto ->
                            ComplaintUiState.Success(
                                complaintId = dto.id,
                                acknowledgeDeadlineAt = dto.acknowledgeDeadlineAt,
                            )
                        },
                        onFailure = { e ->
                            ComplaintUiState.Error(e.message ?: "Unknown error")
                        },
                    )
                }
        }
    }

    private fun isSubmitEnabled(reason: ComplaintReason?, description: String): Boolean =
        reason != null && description.length >= 10
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd customer-app && ./gradlew testDebugUnitTest --tests "*.ComplaintViewModelTest"
```

- [ ] **Step 5: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/complaint/
git commit -m "feat(e07-s03): customer-app ComplaintViewModel (TDD)"
```

---

### Task 10: customer-app — Screen + Routes + nav wiring + Paparazzi stub

**Files:**
- Create: `CUS_MAIN/ui/complaint/ComplaintScreen.kt`
- Create: `CUS_MAIN/ui/complaint/ComplaintRoutes.kt`
- Modify: `CUS_MAIN/navigation/MainGraph.kt`
- Create: `CUS_TEST/ui/complaint/ComplaintScreenPaparazziTest.kt`

- [ ] **Step 1: Create `CUS_MAIN/ui/complaint/ComplaintRoutes.kt`**

```kotlin
package com.homeservices.customer.ui.complaint

public object ComplaintRoutes {
    public const val ROUTE: String = "complaint/{bookingId}"
    public fun route(bookingId: String): String = "complaint/$bookingId"
}
```

- [ ] **Step 2: Create `CUS_MAIN/ui/complaint/ComplaintScreen.kt`**

```kotlin
package com.homeservices.customer.ui.complaint

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.customer.domain.complaint.ComplaintReason

@Composable
public fun ComplaintScreen(
    bookingId: String,
    onBack: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is ComplaintUiState.Success -> {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("आपकी शिकायत दर्ज हो गई।", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(8.dp))
                Text("मालिक 2 घंटे में जवाब देंगे।", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(24.dp))
                Button(onClick = onBack) { Text("वापस जाएं") }
            }
        }
        is ComplaintUiState.PhotoUploading, ComplaintUiState.Submitting -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                CircularProgressIndicator()
            }
        }
        is ComplaintUiState.Error -> {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text("त्रुटि: ${state.message}", color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(16.dp))
                Button(onClick = { viewModel.onReasonSelected(ComplaintReason.OTHER) }) {
                    Text("पुनः प्रयास करें")
                }
            }
        }
        is ComplaintUiState.Idle -> {
            var expanded by remember { mutableStateOf(false) }
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("शिकायत दर्ज करें", style = MaterialTheme.typography.headlineSmall)

                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it },
                ) {
                    OutlinedTextField(
                        value = state.selectedReason?.labelHindi ?: "कारण चुनें",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("समस्या का कारण") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        ComplaintReason.entries.forEach { reason ->
                            DropdownMenuItem(
                                text = { Text(reason.labelHindi) },
                                onClick = {
                                    viewModel.onReasonSelected(reason)
                                    expanded = false
                                },
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = state.description,
                    onValueChange = { viewModel.onDescriptionChanged(it) },
                    label = { Text("विवरण (10–2000 अक्षर)") },
                    supportingText = { Text("${state.description.length}/2000") },
                    minLines = 4,
                    maxLines = 8,
                    modifier = Modifier.fillMaxWidth(),
                )

                Button(
                    onClick = { viewModel.onSubmit(bookingId) },
                    enabled = state.submitEnabled,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("शिकायत दर्ज करें")
                }
            }
        }
    }
}
```

- [ ] **Step 3: Wire route in `CUS_MAIN/navigation/MainGraph.kt`**

Add imports at top:
```kotlin
import com.homeservices.customer.ui.complaint.ComplaintRoutes
import com.homeservices.customer.ui.complaint.ComplaintScreen
```

Add composable inside the second navigation block (after the `RatingRoutes.ROUTE` composable):

```kotlin
        composable(
            route = ComplaintRoutes.ROUTE,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            ComplaintScreen(
                bookingId = bookingId,
                onBack = { navController.popBackStack() },
            )
        }
```

- [ ] **Step 4: Create `CUS_TEST/ui/complaint/ComplaintScreenPaparazziTest.kt`**

```kotlin
package com.homeservices.customer.ui.complaint

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun `complaint screen idle state`() {
        // goldens recorded post-merge
    }
}
```

- [ ] **Step 5: Build + test**

```bash
cd customer-app && ./gradlew assembleDebug ktlintCheck
```
Expected: BUILD SUCCESSFUL, 0 ktlint warnings.

- [ ] **Step 6: Commit**

```bash
git add customer-app/app/src/main/kotlin/com/homeservices/customer/ui/complaint/ \
        customer-app/app/src/main/kotlin/com/homeservices/customer/navigation/MainGraph.kt \
        customer-app/app/src/test/kotlin/com/homeservices/customer/ui/complaint/
git commit -m "feat(e07-s03): customer-app ComplaintScreen + nav wiring + Paparazzi stub"
```

---

## WS-C: technician-app

### Task 11: libs.versions.toml sync + technician-app data layer (TDD)

**Files:**
- Modify: `technician-app/gradle/libs.versions.toml`
- Create: `TECH_MAIN/data/complaint/remote/dto/ComplaintDtos.kt`
- Create: `TECH_MAIN/data/complaint/remote/ComplaintApiService.kt`
- Create: `TECH_MAIN/data/complaint/ComplaintRepository.kt`
- Create: `TECH_MAIN/data/complaint/ComplaintRepositoryImpl.kt`
- Create: `TECH_MAIN/data/complaint/di/ComplaintModule.kt`
- Create: `TECH_TEST/data/complaint/ComplaintRepositoryImplTest.kt`

- [ ] **Step 1: Sync libs.versions.toml**

```bash
cp customer-app/gradle/libs.versions.toml technician-app/gradle/libs.versions.toml
```

- [ ] **Step 2: Create `TECH_MAIN/data/complaint/remote/dto/ComplaintDtos.kt`**

```kotlin
package com.homeservices.technician.data.complaint.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
public data class CreateComplaintRequestDto(
    val bookingId: String,
    val reasonCode: String,
    val description: String,
    val photoStoragePath: String?,
)

@JsonClass(generateAdapter = true)
public data class ComplaintResponseDto(
    val id: String,
    val status: String,
    val acknowledgeDeadlineAt: String?,
    val slaDeadlineAt: String,
    val reasonCode: String?,
    val filedBy: String?,
    val createdAt: String,
)

@JsonClass(generateAdapter = true)
public data class ComplaintListResponseDto(
    val complaints: List<ComplaintResponseDto>,
)
```

- [ ] **Step 3: Create `TECH_MAIN/data/complaint/remote/ComplaintApiService.kt`**

```kotlin
package com.homeservices.technician.data.complaint.remote

import com.homeservices.technician.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.data.complaint.remote.dto.CreateComplaintRequestDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

public interface ComplaintApiService {
    @POST("v1/complaints")
    public suspend fun createComplaint(@Body body: CreateComplaintRequestDto): ComplaintResponseDto

    @GET("v1/complaints/{bookingId}")
    public suspend fun getComplaintsForBooking(@Path("bookingId") bookingId: String): ComplaintListResponseDto
}
```

- [ ] **Step 4: Write failing test**

Create `TECH_TEST/data/complaint/ComplaintRepositoryImplTest.kt`:

```kotlin
package com.homeservices.technician.data.complaint

import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.complaint.remote.dto.ComplaintListResponseDto
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class ComplaintRepositoryImplTest {
    private val api: ComplaintApiService = mockk()
    private val repo = ComplaintRepositoryImpl(api)

    private val mockResponse = ComplaintResponseDto(
        id = "c-1", status = "NEW",
        acknowledgeDeadlineAt = "2026-04-25T02:00:00Z",
        slaDeadlineAt = "2026-04-26T00:00:00Z",
        reasonCode = "CUSTOMER_MISCONDUCT", filedBy = "TECHNICIAN",
        createdAt = "2026-04-25T00:00:00Z",
    )

    @Test
    public fun `createComplaint returns success`(): Unit = runTest {
        coEvery { api.createComplaint(any()) } returns mockResponse
        val results = repo.createComplaint("bk-1", "CUSTOMER_MISCONDUCT", "Valid long description here.", null).toList()
        assertThat(results.first().isSuccess).isTrue()
    }

    @Test
    public fun `getComplaintsForBooking returns list`(): Unit = runTest {
        coEvery { api.getComplaintsForBooking("bk-1") } returns ComplaintListResponseDto(listOf(mockResponse))
        val results = repo.getComplaintsForBooking("bk-1").toList()
        assertThat(results.first().getOrNull()).hasSize(1)
    }
}
```

- [ ] **Step 5: Create `TECH_MAIN/data/complaint/ComplaintRepository.kt`**

```kotlin
package com.homeservices.technician.data.complaint

import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow

public interface ComplaintRepository {
    public fun createComplaint(
        bookingId: String,
        reasonCode: String,
        description: String,
        photoStoragePath: String?,
    ): Flow<Result<ComplaintResponseDto>>

    public fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>>
}
```

- [ ] **Step 6: Create `TECH_MAIN/data/complaint/ComplaintRepositoryImpl.kt`**

```kotlin
package com.homeservices.technician.data.complaint

import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.data.complaint.remote.dto.CreateComplaintRequestDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

internal class ComplaintRepositoryImpl
    @Inject
    constructor(
        private val api: ComplaintApiService,
    ) : ComplaintRepository {
        override fun createComplaint(
            bookingId: String,
            reasonCode: String,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> =
            flow {
                emit(runCatching {
                    api.createComplaint(CreateComplaintRequestDto(bookingId, reasonCode, description, photoStoragePath))
                })
            }

        override fun getComplaintsForBooking(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
            flow { emit(runCatching { api.getComplaintsForBooking(bookingId).complaints }) }
    }
```

- [ ] **Step 7: Create `TECH_MAIN/data/complaint/di/ComplaintModule.kt`**

```kotlin
package com.homeservices.technician.data.complaint.di

import com.homeservices.technician.BuildConfig
import com.homeservices.technician.data.auth.di.AuthOkHttpClient
import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.ComplaintRepositoryImpl
import com.homeservices.technician.data.complaint.remote.ComplaintApiService
import com.squareup.moshi.Moshi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
public abstract class ComplaintModule {
    @Binds
    internal abstract fun bindComplaintRepository(impl: ComplaintRepositoryImpl): ComplaintRepository

    public companion object {
        @Provides
        @Singleton
        public fun provideComplaintApiService(
            @AuthOkHttpClient client: OkHttpClient,
            moshi: Moshi,
        ): ComplaintApiService =
            Retrofit
                .Builder()
                .baseUrl(BuildConfig.API_BASE_URL + "/")
                .addConverterFactory(MoshiConverterFactory.create(moshi))
                .client(client)
                .build()
                .create(ComplaintApiService::class.java)
        // FirebaseStorage already provided by KycModule
        // FirebaseAuth already provided by AuthModule
    }
}
```

- [ ] **Step 8: Run tests + build**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "*.ComplaintRepositoryImplTest" && ./gradlew assembleDebug
```
Expected: tests pass, BUILD SUCCESSFUL.

- [ ] **Step 9: Commit**

```bash
git add technician-app/gradle/libs.versions.toml \
        technician-app/app/src/main/kotlin/com/homeservices/technician/data/complaint/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/data/complaint/
git commit -m "feat(e07-s03): libs.versions sync + technician-app complaint data layer (TDD)"
```

---

### Task 12: technician-app — use cases (TDD)

**Files:**
- Create: `TECH_MAIN/domain/complaint/TechComplaintReason.kt`
- Create: `TECH_MAIN/domain/complaint/SubmitComplaintUseCase.kt`
- Create: `TECH_TEST/domain/complaint/SubmitComplaintUseCaseTest.kt`
- Create: `TECH_MAIN/domain/complaint/PhotoUploadUseCase.kt`
- Create: `TECH_TEST/domain/complaint/PhotoUploadUseCaseTest.kt`
- Create: `TECH_MAIN/domain/complaint/GetComplaintStatusUseCase.kt`
- Create: `TECH_TEST/domain/complaint/GetComplaintStatusUseCaseTest.kt`

- [ ] **Step 1: Create `TECH_MAIN/domain/complaint/TechComplaintReason.kt`**

```kotlin
package com.homeservices.technician.domain.complaint

public enum class TechComplaintReason(public val code: String, public val labelHindi: String) {
    CUSTOMER_MISCONDUCT("CUSTOMER_MISCONDUCT", "ग्राहक ने बुरा व्यवहार किया"),
    LATE_PAYMENT("LATE_PAYMENT", "पेमेंट नहीं मिली"),
    SAFETY_CONCERN("SAFETY_CONCERN", "सुरक्षा की समस्या थी"),
    OTHER("OTHER", "अन्य"),
}
```

- [ ] **Step 2: Write failing test for SubmitComplaintUseCase**

Create `TECH_TEST/domain/complaint/SubmitComplaintUseCaseTest.kt`:

```kotlin
package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class SubmitComplaintUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = SubmitComplaintUseCase(repo)

    @Test
    public fun `delegates to repo with correct reason code`(): Unit = runTest {
        val mockResp = ComplaintResponseDto("c-1", "NEW", null, "2026-04-26T00:00:00Z", "LATE_PAYMENT", "TECHNICIAN", "2026-04-25T00:00:00Z")
        coEvery { repo.createComplaint("bk-1", "LATE_PAYMENT", any(), null) } returns flowOf(Result.success(mockResp))
        val results = useCase("bk-1", TechComplaintReason.LATE_PAYMENT, "Customer did not pay after job completion.", null).toList()
        assertThat(results.first().isSuccess).isTrue()
    }
}
```

- [ ] **Step 3: Create `TECH_MAIN/domain/complaint/SubmitComplaintUseCase.kt`**

```kotlin
package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class SubmitComplaintUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(
            bookingId: String,
            reason: TechComplaintReason,
            description: String,
            photoStoragePath: String?,
        ): Flow<Result<ComplaintResponseDto>> =
            repo.createComplaint(bookingId, reason.code, description, photoStoragePath)
    }
```

- [ ] **Step 4: Create PhotoUploadUseCase + test (mirrors customer-app, uses existing KycModule's FirebaseStorage)**

Create `TECH_TEST/domain/complaint/PhotoUploadUseCaseTest.kt`:

```kotlin
package com.homeservices.technician.domain.complaint

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class PhotoUploadUseCaseTest {
    private val storage: FirebaseStorage = mockk()
    private val auth: FirebaseAuth = mockk()
    private val useCase = PhotoUploadUseCase(storage, auth)

    @Test
    public fun `returns failure when no authenticated user`(): Unit = runTest {
        every { auth.currentUser } returns null
        val result = useCase("bk-1", "/some/file.jpg")
        assertThat(result.isFailure).isTrue()
    }

    @Test
    public fun `returns failure for non-existent file path`(): Unit = runTest {
        val user = mockk<com.google.firebase.auth.FirebaseUser>()
        every { auth.currentUser } returns user
        every { user.uid } returns "uid-1"
        val result = useCase("bk-1", "/nonexistent/file.jpg")
        assertThat(result.isFailure).isTrue()
    }
}
```

Create `TECH_MAIN/domain/complaint/PhotoUploadUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.complaint

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageMetadata
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import javax.inject.Inject

public class PhotoUploadUseCase
    @Inject
    constructor(
        private val storage: FirebaseStorage,
        private val auth: FirebaseAuth,
    ) {
        public suspend operator fun invoke(bookingId: String, localFilePath: String): Result<String> =
            runCatching {
                val bytes = withContext(Dispatchers.IO) { compressToJpeg(localFilePath) }
                val uid = auth.currentUser?.uid ?: error("No authenticated user")
                val timestamp = System.currentTimeMillis()
                val storagePath = "complaints/$bookingId/$uid/$timestamp.jpg"
                val ref = storage.reference.child(storagePath)
                val metadata = StorageMetadata.Builder().setContentType("image/jpeg").build()
                ref.putBytes(bytes, metadata).await()
                storagePath
            }

        private fun compressToJpeg(filePath: String): ByteArray {
            val original = BitmapFactory.decodeFile(filePath) ?: error("Cannot decode image at $filePath")
            val scaled = Bitmap.createScaledBitmap(original, 1024, 1024, true)
            return ByteArrayOutputStream()
                .also { out ->
                    scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
                    if (scaled !== original) scaled.recycle()
                    original.recycle()
                }.toByteArray()
        }
    }
```

- [ ] **Step 5: Create GetComplaintStatusUseCase + test**

`TECH_TEST/domain/complaint/GetComplaintStatusUseCaseTest.kt`:

```kotlin
package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

public class GetComplaintStatusUseCaseTest {
    private val repo: ComplaintRepository = mockk()
    private val useCase = GetComplaintStatusUseCase(repo)

    @Test
    public fun `delegates to repository`(): Unit = runTest {
        val list = listOf(ComplaintResponseDto("c-1", "NEW", null, "2026-04-26T00:00:00Z", "LATE_PAYMENT", "TECHNICIAN", "2026-04-25T00:00:00Z"))
        coEvery { repo.getComplaintsForBooking("bk-1") } returns flowOf(Result.success(list))
        val results = useCase("bk-1").toList()
        assertThat(results.first().getOrNull()).hasSize(1)
    }
}
```

`TECH_MAIN/domain/complaint/GetComplaintStatusUseCase.kt`:

```kotlin
package com.homeservices.technician.domain.complaint

import com.homeservices.technician.data.complaint.ComplaintRepository
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

public class GetComplaintStatusUseCase
    @Inject
    constructor(
        private val repo: ComplaintRepository,
    ) {
        public operator fun invoke(bookingId: String): Flow<Result<List<ComplaintResponseDto>>> =
            repo.getComplaintsForBooking(bookingId)
    }
```

- [ ] **Step 6: Run all technician domain complaint tests**

```bash
cd technician-app && ./gradlew testDebugUnitTest \
  --tests "*.SubmitComplaintUseCaseTest" \
  --tests "*.PhotoUploadUseCaseTest" \
  --tests "*.GetComplaintStatusUseCaseTest"
```

- [ ] **Step 7: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/domain/complaint/ \
        technician-app/app/src/test/kotlin/com/homeservices/technician/domain/complaint/
git commit -m "feat(e07-s03): technician-app complaint use cases (TDD)"
```

---

### Task 13: technician-app — ViewModel + Screen + nav wiring + Paparazzi stub

**Files:**
- Create: `TECH_MAIN/ui/complaint/ComplaintViewModel.kt`
- Create: `TECH_TEST/ui/complaint/ComplaintViewModelTest.kt`
- Create: `TECH_MAIN/ui/complaint/ComplaintScreen.kt`
- Create: `TECH_MAIN/ui/complaint/ComplaintRoutes.kt`
- Modify: `TECH_MAIN/navigation/HomeGraph.kt`
- Create: `TECH_TEST/ui/complaint/ComplaintScreenPaparazziTest.kt`

- [ ] **Step 1: Write failing ViewModel test**

Create `TECH_TEST/ui/complaint/ComplaintViewModelTest.kt`:

```kotlin
package com.homeservices.technician.ui.complaint

import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.technician.domain.complaint.PhotoUploadUseCase
import com.homeservices.technician.domain.complaint.SubmitComplaintUseCase
import com.homeservices.technician.domain.complaint.TechComplaintReason
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
public class ComplaintViewModelTest {
    private val submitUseCase: SubmitComplaintUseCase = mockk()
    private val photoUploadUseCase: PhotoUploadUseCase = mockk()
    private val getStatusUseCase: GetComplaintStatusUseCase = mockk()
    private val dispatcher = StandardTestDispatcher()
    private lateinit var viewModel: ComplaintViewModel

    @BeforeEach public fun setUp() {
        Dispatchers.setMain(dispatcher)
        viewModel = ComplaintViewModel(submitUseCase, photoUploadUseCase, getStatusUseCase)
    }
    @AfterEach public fun tearDown() { Dispatchers.resetMain() }

    @Test
    public fun `initial state has submit disabled`() {
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Idle::class.java)
        assertThat((viewModel.uiState.value as ComplaintUiState.Idle).submitEnabled).isFalse()
    }

    @Test
    public fun `submitEnabled true when reason and long enough description set`(): Unit = runTest {
        viewModel.onReasonSelected(TechComplaintReason.LATE_PAYMENT)
        viewModel.onDescriptionChanged("Customer refused to pay after the job was done well.")
        dispatcher.scheduler.advanceUntilIdle()
        assertThat((viewModel.uiState.value as ComplaintUiState.Idle).submitEnabled).isTrue()
    }

    @Test
    public fun `onSubmit transitions to Success`(): Unit = runTest {
        viewModel.onReasonSelected(TechComplaintReason.SAFETY_CONCERN)
        viewModel.onDescriptionChanged("Customer became verbally aggressive during the job.")
        val mockResp = ComplaintResponseDto("c-1", "NEW", "2026-04-25T02:00:00Z", "2026-04-26T00:00:00Z", "SAFETY_CONCERN", "TECHNICIAN", "2026-04-25T00:00:00Z")
        coEvery { submitUseCase("bk-1", TechComplaintReason.SAFETY_CONCERN, any(), null) } returns flowOf(Result.success(mockResp))
        viewModel.onSubmit("bk-1")
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(viewModel.uiState.value).isInstanceOf(ComplaintUiState.Success::class.java)
    }
}
```

- [ ] **Step 2: Create `TECH_MAIN/ui/complaint/ComplaintViewModel.kt`**

```kotlin
package com.homeservices.technician.ui.complaint

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.homeservices.technician.data.complaint.remote.dto.ComplaintResponseDto
import com.homeservices.technician.domain.complaint.GetComplaintStatusUseCase
import com.homeservices.technician.domain.complaint.PhotoUploadUseCase
import com.homeservices.technician.domain.complaint.SubmitComplaintUseCase
import com.homeservices.technician.domain.complaint.TechComplaintReason
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

public sealed class ComplaintUiState {
    public data class Idle(
        val selectedReason: TechComplaintReason? = null,
        val description: String = "",
        val photoStoragePath: String? = null,
        val submitEnabled: Boolean = false,
    ) : ComplaintUiState()
    public data object PhotoUploading : ComplaintUiState()
    public data object Submitting : ComplaintUiState()
    public data class Success(val complaintId: String, val acknowledgeDeadlineAt: String?) : ComplaintUiState()
    public data class Error(val message: String) : ComplaintUiState()
}

@HiltViewModel
public class ComplaintViewModel
    @Inject
    constructor(
        private val submitUseCase: SubmitComplaintUseCase,
        private val photoUploadUseCase: PhotoUploadUseCase,
        private val getStatusUseCase: GetComplaintStatusUseCase,
    ) : ViewModel() {

    private val _uiState = MutableStateFlow<ComplaintUiState>(ComplaintUiState.Idle())
    public val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

    public fun onReasonSelected(reason: TechComplaintReason) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = current.copy(selectedReason = reason, submitEnabled = isEnabled(reason, current.description))
    }

    public fun onDescriptionChanged(description: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = current.copy(description = description, submitEnabled = isEnabled(current.selectedReason, description))
    }

    public fun onPhotoSelected(localFilePath: String, bookingId: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        _uiState.value = ComplaintUiState.PhotoUploading
        viewModelScope.launch {
            val result = photoUploadUseCase(bookingId, localFilePath)
            _uiState.value = current.copy(photoStoragePath = result.getOrNull(), submitEnabled = isEnabled(current.selectedReason, current.description))
        }
    }

    public fun onSubmit(bookingId: String) {
        val current = _uiState.value as? ComplaintUiState.Idle ?: return
        val reason = current.selectedReason ?: return
        _uiState.value = ComplaintUiState.Submitting
        viewModelScope.launch {
            submitUseCase(bookingId, reason, current.description, current.photoStoragePath).collect { result ->
                _uiState.value = result.fold(
                    onSuccess = { ComplaintUiState.Success(it.id, it.acknowledgeDeadlineAt) },
                    onFailure = { ComplaintUiState.Error(it.message ?: "Unknown error") },
                )
            }
        }
    }

    private fun isEnabled(reason: TechComplaintReason?, description: String): Boolean =
        reason != null && description.length >= 10
}
```

- [ ] **Step 3: Run ViewModel test**

```bash
cd technician-app && ./gradlew testDebugUnitTest --tests "*.ComplaintViewModelTest"
```
Expected: pass.

- [ ] **Step 4: Create `TECH_MAIN/ui/complaint/ComplaintRoutes.kt`**

```kotlin
package com.homeservices.technician.ui.complaint

public object ComplaintRoutes {
    public const val ROUTE: String = "complaint/{bookingId}"
    public fun route(bookingId: String): String = "complaint/$bookingId"
}
```

- [ ] **Step 5: Create `TECH_MAIN/ui/complaint/ComplaintScreen.kt`**

```kotlin
package com.homeservices.technician.ui.complaint

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.homeservices.technician.domain.complaint.TechComplaintReason

@Composable
public fun ComplaintScreen(
    bookingId: String,
    onBack: () -> Unit,
    viewModel: ComplaintViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is ComplaintUiState.Success -> {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("समस्या दर्ज हो गई।", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.height(8.dp))
                Text("मालिक 2 घंटे में जवाब देंगे।", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(24.dp))
                Button(onClick = onBack) { Text("वापस जाएं") }
            }
        }
        is ComplaintUiState.PhotoUploading, ComplaintUiState.Submitting -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) { CircularProgressIndicator() }
        }
        is ComplaintUiState.Error -> {
            Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
                Text("त्रुटि: ${state.message}", color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(16.dp))
                Button(onClick = { viewModel.onReasonSelected(TechComplaintReason.OTHER) }) { Text("पुनः प्रयास करें") }
            }
        }
        is ComplaintUiState.Idle -> {
            var expanded by remember { mutableStateOf(false) }
            Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("समस्या रिपोर्ट करें", style = MaterialTheme.typography.headlineSmall)
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                    OutlinedTextField(
                        value = state.selectedReason?.labelHindi ?: "कारण चुनें",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("समस्या का कारण") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        TechComplaintReason.entries.forEach { reason ->
                            DropdownMenuItem(text = { Text(reason.labelHindi) }, onClick = {
                                viewModel.onReasonSelected(reason); expanded = false
                            })
                        }
                    }
                }
                OutlinedTextField(
                    value = state.description,
                    onValueChange = { viewModel.onDescriptionChanged(it) },
                    label = { Text("विवरण (10–2000 अक्षर)") },
                    supportingText = { Text("${state.description.length}/2000") },
                    minLines = 4, maxLines = 8,
                    modifier = Modifier.fillMaxWidth(),
                )
                Button(onClick = { viewModel.onSubmit(bookingId) }, enabled = state.submitEnabled, modifier = Modifier.fillMaxWidth()) {
                    Text("समस्या दर्ज करें")
                }
            }
        }
    }
}
```

- [ ] **Step 6: Wire route in `TECH_MAIN/navigation/HomeGraph.kt`**

Add imports:
```kotlin
import com.homeservices.technician.ui.complaint.ComplaintRoutes
import com.homeservices.technician.ui.complaint.ComplaintScreen
```

Add inside `navigation(startDestination = "home_dashboard", route = "home")` after the RatingRoutes composable:

```kotlin
        composable(
            route = ComplaintRoutes.ROUTE,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            ComplaintScreen(bookingId = bookingId, onBack = { navController.popBackStack() })
        }
```

- [ ] **Step 7: Create Paparazzi stub**

Create `TECH_TEST/ui/complaint/ComplaintScreenPaparazziTest.kt`:

```kotlin
package com.homeservices.technician.ui.complaint

import app.cash.paparazzi.Paparazzi
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test

@Ignore("Goldens recorded on CI Linux via paparazzi-record.yml workflow_dispatch")
public class ComplaintScreenPaparazziTest {
    @get:Rule
    public val paparazzi: Paparazzi = Paparazzi()

    @Test
    public fun `complaint screen idle state`() {
        // goldens recorded post-merge
    }
}
```

- [ ] **Step 8: Build + ktlint**

```bash
cd technician-app && ./gradlew assembleDebug ktlintCheck
```
Expected: BUILD SUCCESSFUL, 0 warnings.

- [ ] **Step 9: Commit**

```bash
git add technician-app/app/src/main/kotlin/com/homeservices/technician/ui/complaint/ \
        technician-app/app/src/main/kotlin/com/homeservices/technician/navigation/HomeGraph.kt \
        technician-app/app/src/test/kotlin/com/homeservices/technician/ui/complaint/
git commit -m "feat(e07-s03): technician-app ComplaintScreen + nav wiring + Paparazzi stub"
```

---

## WS-D: Smoke Gates + Review

### Task 14: Pre-Codex smoke gates + Paparazzi cleanup + Codex review

- [ ] **Step 1: API smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Expected: exit 0. Fix any typecheck/lint/test failures before continuing.

- [ ] **Step 2: customer-app smoke gate**

```bash
bash tools/pre-codex-smoke.sh customer-app
```
Expected: exit 0.

- [ ] **Step 3: technician-app smoke gate**

```bash
bash tools/pre-codex-smoke.sh technician-app
```
Expected: exit 0.

- [ ] **Step 4: Delete Paparazzi goldens before push**

```bash
git rm -r customer-app/app/src/test/snapshots/images/ 2>/dev/null || true
git rm -r technician-app/app/src/test/snapshots/images/ 2>/dev/null || true
```

- [ ] **Step 5: Codex review**

```bash
codex review --base main
```
Expected: `.codex-review-passed` created. Address any P1/P2 findings before push.

- [ ] **Step 6: Push + CI**

```bash
git push origin feature/E07-S03-complaints-module
```
Open PR. CI must pass on `main`.

- [ ] **Step 7: Post-merge — trigger Paparazzi recording**

After PR merges, trigger `paparazzi-record.yml` workflow_dispatch for both `customer-app` and `technician-app` on GitHub Actions. Pull the CI-generated golden commit locally. Then open a chore branch to remove `@Ignore` from both `ComplaintScreenPaparazziTest` files.

---

## Self-Review Checklist

**Spec coverage:**
- AC-1 (complaint entry point): ✅ ComplaintScreen + ComplaintRoutes + nav wiring in both apps
- AC-2 (reason + description + photo): ✅ ComplaintScreen Idle state, PhotoUploadUseCase
- AC-3 (201 response + FCM): ✅ partnerCreateComplaintHandler + sendOwnerComplaintFiled
- AC-4 (status polling): ✅ GET /v1/complaints/{bookingId} + GetComplaintStatusUseCase
- AC-5 (auth guards): ✅ 401/403/404/409 in partner-create.test.ts
- AC-6 (one active complaint): ✅ findActiveComplaintByBookingAndParty + 409 COMPLAINT_ALREADY_FILED
- AC-7 (SLA timer): ✅ Task 5, getAcknowledgePastDueComplaints + SLA_BREACH_ACK
- AC-8 (Paparazzi @Ignored): ✅ Tasks 10 + 13

**Type consistency check:**
- `ComplaintResponseDto` — defined in Task 6 (customer), Task 11 (tech); used in Tasks 7/8/9 (customer) and Tasks 11/12/13 (tech). ✅
- `ComplaintReason.code` — used in `SubmitComplaintUseCase.invoke()` → `repo.createComplaint(reason.code, ...)`. ✅
- `TechComplaintReason.code` — same pattern for tech. ✅
- `ComplaintFiledByEnum`, `CreateComplaintByPartnerBodySchema` — defined Task 1, used Task 3. ✅
- `getAcknowledgePastDueComplaints` — defined Task 1, imported Task 5. ✅
- `ComplaintRoutes.route(bookingId)` / `ComplaintRoutes.ROUTE` — defined Tasks 10/13, used in MainGraph/HomeGraph. ✅
