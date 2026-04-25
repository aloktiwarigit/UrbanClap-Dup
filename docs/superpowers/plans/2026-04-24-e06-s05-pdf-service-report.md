# E06-S05 PDF Service Report — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a booking reaches `COMPLETED`, an Azure Function generates a PDF service report (technician, photos, price, warranty, next-service recommendation), uploads it to Firebase Storage, and emails it to the customer via ACS.

**Architecture:** Cosmos change-feed trigger on `bookings` fires `generateAndSendReport()` per COMPLETED document; idempotency guard checks Firebase Storage (`reports/{bookingId}/service-report.pdf`) before generating; photo bytes downloaded from Firebase Storage and embedded in PDF via PDFKit; ACS email sends PDF as attachment. Failure is isolated — Sentry-captured, not re-thrown.

**Tech Stack:** Azure Functions v4 (cosmosDB trigger), PDFKit (install: `pdfkit` + `@types/pdfkit`), `@azure/communication-email` (already installed), Firebase Admin Storage, Vitest unit tests with `vi.mock()`

**Story file:** `docs/stories/E06-S05-pdf-service-report.md`

**Patterns to read first:**
- `api/src/functions/trigger-booking-completed.ts` (E06-S04) — change-feed pattern to replicate exactly
- `api/src/firebase/admin.ts` — existing `getStorageDownloadUrl()` to follow for new Storage helpers

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `api/src/schemas/report.ts` | `ReportData` and `PhotoSet` interfaces |
| `api/src/services/report-data.service.ts` | Assembles `ReportData` from booking + Cosmos + Firebase Auth |
| `api/src/services/pdf-generator.service.ts` | PDFKit: `ReportData` + `PhotoSet[]` → `Buffer` |
| `api/src/services/acs-email.service.ts` | ACS email with PDF attachment |
| `api/src/functions/trigger-service-report.ts` | Change-feed trigger: idempotency → assemble → PDF → upload → email |
| `api/tests/unit/report-data.service.test.ts` | TDD: data assembly |
| `api/tests/unit/pdf-generator.service.test.ts` | TDD: PDF byte output validation |
| `api/tests/unit/trigger-service-report.test.ts` | TDD: idempotency + flow |

### Modified files
| File | Change |
|---|---|
| `api/src/schemas/booking.ts` | Add `completedAt: z.string().optional()` |
| `api/src/functions/active-job.ts` | Set `completedAt` on COMPLETED status transition |
| `api/src/cosmos/technician-repository.ts` | Add `getTechnicianForReport()` |
| `api/src/firebase/admin.ts` | Add `checkStorageFileExists()`, `uploadBufferToStorage()`, `downloadStorageFile()` |

---

## Task 1: Schema extension + completedAt recording

**Files:** `api/src/schemas/booking.ts`, `api/src/functions/active-job.ts`, `api/src/schemas/report.ts`

No tests — pure type changes; TypeScript compilation is the gate.

- [ ] **Step 1: Add `completedAt` to BookingDocSchema**

In `api/src/schemas/booking.ts`, add after `createdAt`:
```typescript
  createdAt: z.string(),
  completedAt: z.string().optional(),
```

- [ ] **Step 2: Set `completedAt` in transitionStatusHandler**

In `api/src/functions/active-job.ts`, replace the `updateBookingFields` call in `transitionStatusHandler`:
```typescript
  const updated = await updateBookingFields(bookingId, {
    status: body.targetStatus as BookingDoc['status'],
    ...(body.targetStatus === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
  });
```

- [ ] **Step 3: Create `api/src/schemas/report.ts`**

```typescript
export interface ReportData {
  bookingId: string;
  serviceName: string;
  categoryId: string;
  completedAt: string;
  warrantyExpiresAt: string;
  nextServiceRecommendation: string;
  technician: { id: string; name: string; rating: number };
  customer: { email: string; displayName: string };
  priceBreakdown: {
    baseAmount: number;
    approvedAddOns: Array<{ name: string; price: number }>;
    finalAmount: number;
  };
}

export interface PhotoSet {
  stage: string;
  photos: Buffer[];
}
```

- [ ] **Step 4: Verify COSMOS_CONNECTION_STRING in `api/local.settings.example.json`**

```bash
grep COSMOS_CONNECTION_STRING api/local.settings.example.json
```
If missing (E06-S04 not yet on this branch), add:
```json
"COSMOS_CONNECTION_STRING": "AccountEndpoint=<COSMOS_ENDPOINT>;AccountKey=<COSMOS_KEY>;"
```

- [ ] **Step 5: Typecheck + commit**

```bash
cd api && pnpm typecheck
git add api/src/schemas/booking.ts api/src/functions/active-job.ts \
        api/src/schemas/report.ts docs/stories/E06-S05-pdf-service-report.md
git commit -m "feat(e06-s05): completedAt on BookingDoc + ReportData/PhotoSet types"
```

---

## Task 2: Firebase Storage helpers + technician-repository extension

**Files:** `api/src/firebase/admin.ts`, `api/src/cosmos/technician-repository.ts`

No TDD — thin infra wrappers; tested via service/trigger tests.

- [ ] **Step 1: Add three helpers to `api/src/firebase/admin.ts`**

Append after the existing `getStorageDownloadUrl` function:
```typescript
export async function checkStorageFileExists(storagePath: string): Promise<boolean> {
  const [exists] = await getStorage().bucket().file(storagePath).exists();
  return exists;
}

export async function uploadBufferToStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await getStorage().bucket().file(storagePath).save(buffer, { contentType, resumable: false });
}

export async function downloadStorageFile(storagePath: string): Promise<Buffer> {
  const [contents] = await getStorage().bucket().file(storagePath).download();
  return contents as Buffer;
}
```

- [ ] **Step 2: Add `getTechnicianForReport` to `api/src/cosmos/technician-repository.ts`**

Append at the end of the file:
```typescript
// ── Report helpers (E06-S05) ──────────────────────────────────────────────────

export interface TechnicianReportInfo {
  displayName: string;
  rating: number;
}

export async function getTechnicianForReport(
  technicianId: string,
): Promise<TechnicianReportInfo | null> {
  const { resource } = await getCosmosClient()
    .database(DB_NAME)
    .container(CONTAINER)
    .item(technicianId, technicianId)
    .read<{ displayName?: string; rating?: number }>();
  if (!resource) return null;
  return { displayName: resource.displayName ?? 'Technician', rating: resource.rating ?? 0 };
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd api && pnpm typecheck
git add api/src/firebase/admin.ts api/src/cosmos/technician-repository.ts
git commit -m "feat(e06-s05): Firebase Storage helpers + getTechnicianForReport"
```

---

## Task 3: Data assembly service (TDD)

**Files:** `api/tests/unit/report-data.service.test.ts`, `api/src/services/report-data.service.ts`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/unit/report-data.service.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ getUser: vi.fn() }) }));
vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechnicianForReport: vi.fn(),
}));
vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: { getServiceByIdCrossPartition: vi.fn() },
}));

import { assembleReportData } from '../../src/services/report-data.service.js';
import { getTechnicianForReport } from '../../src/cosmos/technician-repository.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import { getAuth } from 'firebase-admin/auth';

const baseBooking = {
  id: 'bk-1', customerId: 'cust-1', technicianId: 'tech-1',
  serviceId: 'ac-deep-clean', categoryId: 'ac-repair',
  slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: '123 Main', addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED' as const, paymentOrderId: 'order-1',
  paymentId: 'pay-1', paymentSignature: 'sig-1', amount: 59900,
  createdAt: '2026-04-24T09:00:00.000Z', completedAt: '2026-04-24T11:00:00.000Z',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getTechnicianForReport).mockResolvedValue({ displayName: 'Ravi Kumar', rating: 4.8 });
  vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({
    id: 'ac-deep-clean', name: 'AC Deep Clean', categoryId: 'ac-repair',
    shortDescription: '', heroImageUrl: '', basePrice: 59900, commissionBps: 2250,
    durationMinutes: 90, includes: [], faq: [], addOns: [], photoStages: [],
    isActive: true, updatedBy: 'seed', createdAt: '', updatedAt: '',
  });
  vi.mocked(getAuth().getUser).mockResolvedValue(
    { email: 'customer@example.com', displayName: 'Priya Sharma' } as any,
  );
});

describe('assembleReportData', () => {
  it('maps core fields: bookingId, serviceName, technician, customer', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.bookingId).toBe('bk-1');
    expect(report.serviceName).toBe('AC Deep Clean');
    expect(report.technician.name).toBe('Ravi Kumar');
    expect(report.technician.rating).toBe(4.8);
    expect(report.customer.email).toBe('customer@example.com');
  });

  it('sets warrantyExpiresAt to completedAt + 7 days', async () => {
    const report = await assembleReportData(baseBooking);
    const expected = new Date('2026-04-24T11:00:00.000Z').getTime() + 7 * 24 * 60 * 60 * 1000;
    expect(new Date(report.warrantyExpiresAt).getTime()).toBe(expected);
  });

  it('uses finalAmount + approvedAddOns when present', async () => {
    const booking = {
      ...baseBooking, finalAmount: 74900,
      approvedAddOns: [{ name: 'Gas Refill', price: 14900, triggerDescription: 'low' }],
    };
    const report = await assembleReportData(booking);
    expect(report.priceBreakdown.finalAmount).toBe(74900);
    expect(report.priceBreakdown.approvedAddOns).toEqual([{ name: 'Gas Refill', price: 14900 }]);
  });

  it('falls back to amount when finalAmount absent', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.priceBreakdown.finalAmount).toBe(59900);
    expect(report.priceBreakdown.approvedAddOns).toHaveLength(0);
  });

  it('falls back to current time when completedAt missing', async () => {
    const before = Date.now();
    const report = await assembleReportData({ ...baseBooking, completedAt: undefined });
    expect(new Date(report.completedAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('returns next-service recommendation for known category', async () => {
    const report = await assembleReportData(baseBooking);
    expect(report.nextServiceRecommendation).toContain('3 months');
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/report-data.service.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `api/src/services/report-data.service.ts`**

```typescript
import { getAuth } from 'firebase-admin/auth';
import { getTechnicianForReport } from '../cosmos/technician-repository.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { ReportData } from '../schemas/report.js';

const NEXT_SERVICE_RECS: Record<string, string> = {
  'ac-repair': 'Schedule your next AC service in 3 months to maintain cooling efficiency.',
  'deep-cleaning': 'Book your next deep clean in 6 months for a healthy home.',
  'plumbing': 'An annual plumbing inspection is recommended to prevent leaks.',
  'electrical': 'Schedule an annual electrical safety check for peace of mind.',
  'pest-control': 'A follow-up pest treatment in 3 months ensures lasting protection.',
};

export async function assembleReportData(booking: BookingDoc): Promise<ReportData> {
  const completedAt = booking.completedAt ?? new Date().toISOString();
  const warrantyExpiresAt = new Date(
    new Date(completedAt).getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [tech, service, userRecord] = await Promise.all([
    getTechnicianForReport(booking.technicianId!),
    catalogueRepo.getServiceByIdCrossPartition(booking.serviceId),
    getAuth().getUser(booking.customerId),
  ]);

  return {
    bookingId: booking.id,
    serviceName: service?.name ?? 'Home Service',
    categoryId: booking.categoryId,
    completedAt,
    warrantyExpiresAt,
    nextServiceRecommendation:
      NEXT_SERVICE_RECS[booking.categoryId] ?? 'Regular maintenance ensures best results.',
    technician: {
      id: booking.technicianId!,
      name: tech?.displayName ?? 'Your Technician',
      rating: tech?.rating ?? 0,
    },
    customer: {
      email: userRecord.email ?? '',
      displayName: userRecord.displayName ?? 'Valued Customer',
    },
    priceBreakdown: {
      baseAmount: booking.amount,
      approvedAddOns: (booking.approvedAddOns ?? []).map(a => ({ name: a.name, price: a.price })),
      finalAmount: booking.finalAmount ?? booking.amount,
    },
  };
}
```

- [ ] **Step 4: Run to confirm GREEN, then commit**

```bash
cd api && pnpm test tests/unit/report-data.service.test.ts
git add api/tests/unit/report-data.service.test.ts api/src/services/report-data.service.ts
git commit -m "feat(e06-s05): report-data assembly service (TDD)"
```

---

## Task 4: PDF generator (TDD)

**Files:** `api/tests/unit/pdf-generator.service.test.ts`, `api/src/services/pdf-generator.service.ts`

- [ ] **Step 1: Install PDFKit**

```bash
cd api && pnpm add pdfkit && pnpm add -D @types/pdfkit
```

- [ ] **Step 2: Write the failing tests**

Create `api/tests/unit/pdf-generator.service.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateServiceReportPdf } from '../../src/services/pdf-generator.service.js';
import type { ReportData, PhotoSet } from '../../src/schemas/report.js';

const report: ReportData = {
  bookingId: 'bk-test', serviceName: 'AC Deep Clean', categoryId: 'ac-repair',
  completedAt: '2026-04-24T11:00:00.000Z', warrantyExpiresAt: '2026-05-01T11:00:00.000Z',
  nextServiceRecommendation: 'Schedule next AC service in 3 months.',
  technician: { id: 'tech-1', name: 'Ravi Kumar', rating: 4.8 },
  customer: { email: 'priya@example.com', displayName: 'Priya Sharma' },
  priceBreakdown: { baseAmount: 59900, approvedAddOns: [{ name: 'Gas Refill', price: 14900 }], finalAmount: 74900 },
};

describe('generateServiceReportPdf', () => {
  it('returns a Buffer that starts with PDF magic bytes', async () => {
    const result = await generateServiceReportPdf(report, []);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('generates a non-trivially sized output', async () => {
    const result = await generateServiceReportPdf(report, []);
    expect(result.length).toBeGreaterThan(1000);
  });

  it('completes without error when photoSets is empty', async () => {
    const photoSets: PhotoSet[] = [];
    await expect(generateServiceReportPdf(report, photoSets)).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 3: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/pdf-generator.service.test.ts
```

- [ ] **Step 4: Implement `api/src/services/pdf-generator.service.ts`**

```typescript
import PDFDocument from 'pdfkit';
import type { ReportData, PhotoSet } from '../schemas/report.js';

function paise(n: number): string { return `₹${(n / 100).toFixed(2)}`; }
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });
}

export function generateServiceReportPdf(report: ReportData, photoSets: PhotoSet[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).font('Helvetica-Bold').text('Service Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#666')
       .text(`Booking ID: ${report.bookingId}`, { align: 'center' }).fillColor('#000').moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Service Details');
    doc.fontSize(11).font('Helvetica')
       .text(`Service: ${report.serviceName}`)
       .text(`Completed: ${fmtDate(report.completedAt)}`).moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Technician');
    doc.fontSize(11).font('Helvetica').text(`Name: ${report.technician.name}`);
    if (report.technician.rating > 0) doc.text(`Rating: ${report.technician.rating.toFixed(1)} / 5.0`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Price Breakdown');
    doc.fontSize(11).font('Helvetica').text(`Base: ${paise(report.priceBreakdown.baseAmount)}`);
    for (const a of report.priceBreakdown.approvedAddOns) doc.text(`${a.name}: +${paise(a.price)}`);
    doc.font('Helvetica-Bold').text(`Total: ${paise(report.priceBreakdown.finalAmount)}`);
    doc.font('Helvetica').moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Warranty');
    doc.fontSize(11).font('Helvetica').text(`Valid until: ${fmtDate(report.warrantyExpiresAt)}`).moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Next Service Recommendation');
    doc.fontSize(11).font('Helvetica').text(report.nextServiceRecommendation).moveDown();

    if (photoSets.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Job Photos').moveDown(0.5);
      for (const set of photoSets) {
        doc.fontSize(12).font('Helvetica-Bold').text(set.stage.replace(/_/g, ' '), { underline: true });
        for (const buf of set.photos) {
          try { doc.image(buf, { fit: [450, 280], align: 'center' }).moveDown(0.5); } catch { /* skip malformed */ }
        }
        doc.moveDown();
      }
    }

    doc.fontSize(9).fillColor('#999')
       .text('Thank you for choosing HomeServices.', { align: 'center' });
    doc.end();
  });
}
```

- [ ] **Step 5: Run to confirm GREEN + typecheck + commit**

```bash
cd api && pnpm test tests/unit/pdf-generator.service.test.ts && pnpm typecheck
git add api/tests/unit/pdf-generator.service.test.ts api/src/services/pdf-generator.service.ts \
        api/package.json pnpm-lock.yaml
git commit -m "feat(e06-s05): PDF generator with PDFKit (TDD)"
```

---

## Task 5: ACS email service + change-feed trigger (TDD)

**Files:** `api/src/services/acs-email.service.ts`, `api/tests/unit/trigger-service-report.test.ts`, `api/src/functions/trigger-service-report.ts`

- [ ] **Step 1: Create `api/src/services/acs-email.service.ts`**

```typescript
import { EmailClient } from '@azure/communication-email';

export interface ServiceReportEmailParams {
  to: string;
  customerName: string;
  bookingId: string;
  pdfBuffer: Buffer;
}

export async function sendServiceReportEmail(params: ServiceReportEmailParams): Promise<void> {
  const conn = process.env['ACS_CONNECTION_STRING'];
  const sender = process.env['ACS_SENDER_ADDRESS'];
  if (!conn) throw new Error('Missing ACS_CONNECTION_STRING');
  if (!sender) throw new Error('Missing ACS_SENDER_ADDRESS');
  const poller = await new EmailClient(conn).beginSend({
    senderAddress: sender,
    recipients: { to: [{ address: params.to, displayName: params.customerName }] },
    content: {
      subject: `Your Service Report — Booking ${params.bookingId}`,
      plainText: `Dear ${params.customerName},\n\nPlease find your service report attached.\n\nThank you for using HomeServices!`,
      html: `<p>Dear ${params.customerName},</p><p>Please find your service report attached.</p><p>Thank you for using HomeServices!</p>`,
    },
    attachments: [{
      name: `service-report-${params.bookingId}.pdf`,
      contentType: 'application/pdf',
      contentInBase64: params.pdfBuffer.toString('base64'),
    }],
  });
  await poller.pollUntilDone();
}
```

- [ ] **Step 2: Write the failing tests**

Create `api/tests/unit/trigger-service-report.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InvocationContext } from '@azure/functions';

vi.mock('../../src/services/report-data.service.js');
vi.mock('../../src/services/pdf-generator.service.js');
vi.mock('../../src/services/acs-email.service.js');
vi.mock('../../src/firebase/admin.js');

import { generateAndSendReport } from '../../src/functions/trigger-service-report.js';
import { assembleReportData } from '../../src/services/report-data.service.js';
import { generateServiceReportPdf } from '../../src/services/pdf-generator.service.js';
import { sendServiceReportEmail } from '../../src/services/acs-email.service.js';
import { checkStorageFileExists, uploadBufferToStorage, downloadStorageFile }
  from '../../src/firebase/admin.js';

const ctx = { log: vi.fn() } as unknown as InvocationContext;

const completed = {
  id: 'bk-1', customerId: 'c-1', technicianId: 'tech-1', serviceId: 'ac-deep-clean',
  categoryId: 'ac-repair', slotDate: '2026-04-24', slotWindow: '09:00-11:00',
  addressText: '123 Main', addressLatLng: { lat: 12.9, lng: 77.6 },
  status: 'COMPLETED', paymentOrderId: 'o-1', paymentId: 'p-1', paymentSignature: 's-1',
  amount: 59900, createdAt: '2026-04-24T09:00:00.000Z', completedAt: '2026-04-24T11:00:00.000Z',
};

const reportData = {
  bookingId: 'bk-1', serviceName: 'AC Deep Clean', categoryId: 'ac-repair',
  completedAt: '2026-04-24T11:00:00.000Z', warrantyExpiresAt: '2026-05-01T11:00:00.000Z',
  nextServiceRecommendation: 'x',
  technician: { id: 'tech-1', name: 'Ravi', rating: 4.8 },
  customer: { email: 'p@example.com', displayName: 'Priya' },
  priceBreakdown: { baseAmount: 59900, approvedAddOns: [], finalAmount: 59900 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkStorageFileExists).mockResolvedValue(false);
  vi.mocked(assembleReportData).mockResolvedValue(reportData);
  vi.mocked(generateServiceReportPdf).mockResolvedValue(Buffer.from('%PDF-fake'));
  vi.mocked(uploadBufferToStorage).mockResolvedValue(undefined);
  vi.mocked(sendServiceReportEmail).mockResolvedValue(undefined);
  vi.mocked(downloadStorageFile).mockResolvedValue(Buffer.alloc(0));
});

describe('generateAndSendReport', () => {
  it('skips non-COMPLETED documents', async () => {
    await generateAndSendReport({ ...completed, status: 'IN_PROGRESS' }, ctx);
    expect(checkStorageFileExists).not.toHaveBeenCalled();
  });

  it('skips COMPLETED booking with no technicianId', async () => {
    await generateAndSendReport({ ...completed, technicianId: undefined }, ctx);
    expect(checkStorageFileExists).not.toHaveBeenCalled();
  });

  it('skips if report already exists in Firebase Storage', async () => {
    vi.mocked(checkStorageFileExists).mockResolvedValue(true);
    await generateAndSendReport(completed, ctx);
    expect(assembleReportData).not.toHaveBeenCalled();
  });

  it('generates PDF, uploads to Storage, and sends email on success', async () => {
    await generateAndSendReport(completed, ctx);
    expect(generateServiceReportPdf).toHaveBeenCalled();
    expect(uploadBufferToStorage).toHaveBeenCalledWith(
      'reports/bk-1/service-report.pdf', expect.any(Buffer), 'application/pdf',
    );
    expect(sendServiceReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'p@example.com', bookingId: 'bk-1' }),
    );
  });

  it('skips email when customer.email is empty', async () => {
    vi.mocked(assembleReportData).mockResolvedValue(
      { ...reportData, customer: { email: '', displayName: 'Priya' } },
    );
    await generateAndSendReport(completed, ctx);
    expect(uploadBufferToStorage).toHaveBeenCalled();
    expect(sendServiceReportEmail).not.toHaveBeenCalled();
  });

  it('isolates errors — does not throw on assembleReportData failure', async () => {
    vi.mocked(assembleReportData).mockRejectedValue(new Error('Cosmos down'));
    await expect(generateAndSendReport(completed, ctx)).resolves.toBeUndefined();
  });

  it('downloads photo bytes for booking.photos paths', async () => {
    const withPhotos = {
      ...completed,
      photos: { IN_PROGRESS: ['bookings/bk-1/photos/tech-1/IN_PROGRESS/1.jpg'] },
    };
    await generateAndSendReport(withPhotos, ctx);
    expect(downloadStorageFile).toHaveBeenCalledWith('bookings/bk-1/photos/tech-1/IN_PROGRESS/1.jpg');
  });
});
```

- [ ] **Step 3: Run to confirm RED**

```bash
cd api && pnpm test tests/unit/trigger-service-report.test.ts
```

- [ ] **Step 4: Implement `api/src/functions/trigger-service-report.ts`**

```typescript
import '../bootstrap.js';
import { app } from '@azure/functions';
import type { InvocationContext } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { BookingDocSchema } from '../schemas/booking.js';
import { assembleReportData } from '../services/report-data.service.js';
import { generateServiceReportPdf } from '../services/pdf-generator.service.js';
import { sendServiceReportEmail } from '../services/acs-email.service.js';
import { checkStorageFileExists, uploadBufferToStorage, downloadStorageFile }
  from '../firebase/admin.js';
import type { PhotoSet } from '../schemas/report.js';

const DB_NAME = process.env['COSMOS_DATABASE'] ?? 'homeservices';

async function downloadPhotoSets(photos: Record<string, string[]>): Promise<PhotoSet[]> {
  const sets = await Promise.all(
    Object.entries(photos).map(async ([stage, paths]) => ({
      stage,
      photos: (await Promise.all(
        paths.map(p => downloadStorageFile(p).catch(() => Buffer.alloc(0))),
      )).filter(b => b.length > 0),
    })),
  );
  return sets.filter(s => s.photos.length > 0);
}

export async function generateAndSendReport(
  bookingRaw: unknown,
  ctx: InvocationContext,
): Promise<void> {
  const parsed = BookingDocSchema.safeParse(bookingRaw);
  if (!parsed.success || parsed.data.status !== 'COMPLETED') return;

  const booking = parsed.data;
  if (!booking.technicianId) { ctx.log(`no technicianId on ${booking.id}`); return; }

  const reportPath = `reports/${booking.id}/service-report.pdf`;
  if (await checkStorageFileExists(reportPath)) {
    ctx.log(`report already exists for ${booking.id} — skipping`);
    return;
  }

  try {
    const [reportData, photoSets] = await Promise.all([
      assembleReportData(booking),
      downloadPhotoSets(booking.photos ?? {}),
    ]);
    const pdfBuffer = await generateServiceReportPdf(reportData, photoSets);
    await uploadBufferToStorage(reportPath, pdfBuffer, 'application/pdf');
    if (reportData.customer.email) {
      await sendServiceReportEmail({
        to: reportData.customer.email,
        customerName: reportData.customer.displayName,
        bookingId: booking.id,
        pdfBuffer,
      });
    }
    ctx.log(`report generated for ${booking.id}`);
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.log(`ERROR ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

app.cosmosDB('triggerServiceReport', {
  connectionStringSetting: 'COSMOS_CONNECTION_STRING',
  databaseName: DB_NAME,
  containerName: 'bookings',
  leaseContainerName: 'booking_report_leases',
  createLeaseContainerIfNotExists: true,
  startFromBeginning: false,
  handler: async (docs: unknown[], context: InvocationContext): Promise<void> => {
    for (const doc of docs) await generateAndSendReport(doc, context);
  },
});
```

- [ ] **Step 5: Run to confirm GREEN + full suite + typecheck + lint**

```bash
cd api && pnpm test tests/unit/trigger-service-report.test.ts
cd api && pnpm test:coverage && pnpm typecheck && pnpm lint
```
Expected: all green; coverage ≥ 80%.

- [ ] **Step 6: Commit**

```bash
git add api/src/services/acs-email.service.ts \
        api/tests/unit/trigger-service-report.test.ts \
        api/src/functions/trigger-service-report.ts
git commit -m "feat(e06-s05): ACS email + change-feed trigger — PDF report on COMPLETED (TDD)"
```

---

## Task 6: Pre-Codex smoke gate + review

- [ ] **Step 1: Smoke gate**

```bash
bash tools/pre-codex-smoke-api.sh
```
Non-zero exit = stop and fix before proceeding (typecheck, lint, test, coverage).

- [ ] **Step 2: Codex review**

```bash
codex review --base main
```
Expected: `.codex-review-passed` written. Fix P1s; note P2s in PR.

- [ ] **Step 3: Push and open PR**

```bash
git push origin feature/E06-S05-pdf-service-report
```
Open PR to `main`. Note in description: Codex P2 findings (if any), CI status.
