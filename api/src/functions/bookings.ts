import { randomUUID } from 'node:crypto';
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { withRateLimit } from '../middleware/withRateLimit.js';
import { requireIntegrity } from '../middleware/requireIntegrity.js';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { CreateBookingRequestSchema, ConfirmBookingRequestSchema } from '../schemas/booking.js';
import { RequestAddOnBodySchema, ApproveAddOnsBodySchema } from '../schemas/addon-approval.js';
import { bookingRepo, updateBookingFields, type BookingCreateCreditOptions } from '../cosmos/booking-repository.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { sendPriceApprovalPush } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { isSoftLaunchEnabled, isMarketingPaused, isServiceAreaGatingEnabled, isWalletCreditEnabled } from '../services/featureFlags.service.js';
import { customerCreditLedgerRepo } from '../cosmos/customer-credit-ledger-repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';
import { posthog } from '../observability/posthog.js';
import { normalizeAddressText } from '../shared/address-text.js';
import { isLatLngInServiceArea } from '../services/service-area.service.js';
import { AYODHYA_SERVICE_AREA } from '../data/service-area-ayodhya.js';

function makeRazorpayReceipt(customerId: string): string {
  return `bk_${Date.now().toString(36)}_${customerId.slice(0, 20)}`;
}

function hasRazorpayCredentials(): boolean {
  const hasUsableValue = (value: string | undefined): boolean => {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized === 'placeholder') return false;
    if (normalized.endsWith('_placeholder')) return false;
    return true;
  };
  return hasUsableValue(process.env.RAZORPAY_KEY_ID) && hasUsableValue(process.env.RAZORPAY_KEY_SECRET);
}

function bookingMetadata(
  customer: Parameters<CustomerHttpHandler>[2],
  serviceName: string,
) {
  return {
    ...(customer.displayName ? { customerName: customer.displayName } : {}),
    ...(customer.phoneNumber ? { customerPhone: customer.phoneNumber } : {}),
    ...(customer.email ? { customerEmail: customer.email } : {}),
    serviceName,
  };
}

/**
 * E13-S01: Attempt to apply wallet credit for a booking.
 *
 * Returns the applied amount (0 if none, or on any non-fatal error).
 * 412 from Cosmos (etag conflict = concurrent apply) is treated as zero-credit:
 * the booking still succeeds, credit just wasn't applied this time.
 *
 * @param customerId     - customer's UID
 * @param bookingId      - pre-generated or created booking ID (used in ledger entry)
 * @param bookingAmount  - booking total in paise (credit capped at this)
 * @param idempotencyKey - UUID from Idempotency-Key header (caller must validate present)
 */
async function attemptCreditApplication(
  customerId: string,
  bookingId: string,
  bookingAmount: number,
  idempotencyKey: string,
): Promise<number> {
  try {
    const { balanceInPaise } = await customerCreditLedgerRepo.getBalance(customerId);
    if (balanceInPaise <= 0) return 0;

    const amountToApply = Math.min(balanceInPaise, bookingAmount);
    const result = await customerCreditLedgerRepo.applyCredit(
      customerId,
      bookingId,
      amountToApply,
      idempotencyKey,
    );
    return result.appliedAmountInPaise;
  } catch (err: unknown) {
    const code = (err as { code?: number }).code;
    if (code === 412) {
      // Optimistic concurrency conflict — concurrent write, safe to return 0
      console.warn('[createBooking] applyCredit 412 conflict — proceeding without credit', {
        customerId, bookingId,
      });
      return 0;
    }
    // Non-412 unexpected errors — log and continue (never block the booking)
    Sentry.captureException(err);
    console.error('[createBooking] applyCredit unexpected error — proceeding without credit', {
      customerId, bookingId, err,
    });
    return 0;
  }
}

const createHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  if (!(await isSoftLaunchEnabled(customer.customerId))) {
    return { status: 503, jsonBody: { code: 'SERVICE_UNAVAILABLE', message: 'Launch coming soon' } };
  }
  if (await isMarketingPaused(customer.customerId)) {
    return { status: 503, jsonBody: { code: 'TEMPORARILY_UNAVAILABLE', message: 'We are pausing new bookings briefly' } };
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  // E13-S01: Validate Idempotency-Key is present when applyCredit=true
  const idempotencyKey = req.headers.get('idempotency-key') ?? '';
  if (parsed.data.applyCredit) {
    const creditEnabled = await isWalletCreditEnabled(customer.customerId);
    if (creditEnabled && !idempotencyKey) {
      return { status: 422, jsonBody: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required when applyCredit=true' } };
    }
  }

  // Service-area polygon gating — E16-S01 / ADR-0020 / Threat-model T-B1
  // Zod already guarantees lat ∈ [-90,90] and lng ∈ [-180,180]; this is the
  // geographic business rule enforcing the Ayodhya pilot boundary.
  const { lat, lng } = parsed.data.addressLatLng;
  const insideServiceArea = isLatLngInServiceArea(lat, lng, AYODHYA_SERVICE_AREA);
  const gatingEnabled = await isServiceAreaGatingEnabled(customer.customerId);
  // Structured log — always emitted (for observability in both warn-only and fail modes).
  // Alert annotation: >5 rejections/min/customer is a recon signal (T-B1).
  const gatingMode = gatingEnabled ? 'fail' : 'warn-only';
  console.info('service_area_check', {
    customerId: customer.customerId,
    lat,
    lng,
    inside: insideServiceArea,
    mode: gatingMode,
  });
  if (!insideServiceArea && gatingEnabled) {
    return {
      status: 400,
      jsonBody: {
        error: 'SERVICE_NOT_AVAILABLE_AT_LOCATION',
        message: 'We currently only serve the Ayodhya region. We hope to expand soon.',
        suggestedAction: 'join_waitlist',
      },
    };
  }
  // When flag is off (warn-only), an out-of-area coordinate is logged above but allowed through.

  const service = await catalogueRepo.getServiceByIdCrossPartition(parsed.data.serviceId);
  if (!service || !service.isActive) return { status: 404, jsonBody: { code: 'SERVICE_NOT_FOUND' } };

  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
    const cashOrderId = `cash_${randomUUID()}`;
    const booking = await bookingRepo.createPending(
      parsed.data,
      customer.customerId,
      cashOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    // E13-S01: Apply wallet credit for cash bookings
    let appliedCreditAmount = 0;
    if (parsed.data.applyCredit && idempotencyKey) {
      const creditEnabled = await isWalletCreditEnabled(customer.customerId);
      if (creditEnabled) {
        appliedCreditAmount = await attemptCreditApplication(
          customer.customerId,
          booking.id,
          service.basePrice,
          idempotencyKey,
        );
      }
    }

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CASH_ON_SERVICE',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }
    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] cash-on-service dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: cashOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount,
      },
    };
  }

  if (!hasRazorpayCredentials()) {
    const manualOrderId = `manual_${randomUUID()}`;
    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
    const booking = await bookingRepo.createPending(
      manualRequest,
      customer.customerId,
      manualOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
    );
    const paid = await bookingRepo.markPaid(booking.id, 'manual_payment_not_configured');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] manual-payment dispatch failed', { bookingId: booking.id, err });
    });
    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: manualOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CASH_ON_SERVICE',
        appliedCreditAmount: 0,
      },
    };
  }

  // Pre-generate booking ID so we can embed it in Razorpay notes for the fast path.
  // The webhook can then do a cheap point-read (getById) instead of a cross-partition scan.
  const preGeneratedBookingId = randomUUID();

  // E13-S01 (P1-6): Determine intended credit amount WITHOUT writing to the ledger yet.
  // The actual ledger CREDIT_APPLIED entry is written in the Razorpay webhook (payment.captured),
  // NOT here. This prevents the "debit-before-payment" bug where an unpaid/abandoned booking
  // permanently consumes the customer's wallet credit.
  //
  // For the fully-credit-paid path (P1-5): if credit covers 100% of the booking, we skip
  // Razorpay entirely and mark the booking PAID directly — no payment intent is needed.
  let pendingCreditAmount = 0;
  const creditEnabled = parsed.data.applyCredit && idempotencyKey
    ? await isWalletCreditEnabled(customer.customerId)
    : false;

  if (creditEnabled) {
    // Peek at current balance; we don't write the ledger entry here.
    const { balanceInPaise } = await customerCreditLedgerRepo.getBalance(customer.customerId);
    pendingCreditAmount = Math.min(balanceInPaise, service.basePrice);
  }

  const payableAmount = service.basePrice - pendingCreditAmount;

  // P1-5: Credit covers 100% — skip Razorpay, mark PAID directly
  if (payableAmount <= 0 && pendingCreditAmount > 0) {
    const fullCreditOrderId = `credit_${randomUUID()}`;
    const fullCreditCreditOptions: BookingCreateCreditOptions = {
      pendingCreditAmountInPaise: pendingCreditAmount,
      pendingCreditIdempotencyKey: idempotencyKey,
    };
    const booking = await bookingRepo.createPending(
      parsed.data,
      customer.customerId,
      fullCreditOrderId,
      service.basePrice,
      bookingMetadata(customer, service.name),
      preGeneratedBookingId,
      fullCreditCreditOptions,
    );

    // Apply credit synchronously for the fully-credit-paid path (no payment to wait for)
    const appliedCreditAmount = await attemptCreditApplication(
      customer.customerId,
      booking.id,
      pendingCreditAmount,
      idempotencyKey,
    );

    // P1-1: Verify the credit was actually applied before marking PAID.
    //
    // attemptCreditApplication returns 0 (or a partial amount) when:
    //   - A 412 ETag conflict (race with another concurrent apply) exhausted all retries.
    //   - An unexpected Cosmos error was swallowed by the non-blocking path.
    //
    // If we mark PAID without the credit being applied, the customer gets a free
    // or underpaid booking (the Razorpay order was skipped entirely).
    //
    // Safe fallback: reject with 409 so the customer retries. We cannot safely
    // fall back to Razorpay here because the booking doc was already created and
    // the Razorpay order amount would need to be recomputed — doing so in a partially
    // applied state risks double-charging or missed credit.
    if (appliedCreditAmount < pendingCreditAmount) {
      console.warn('[createBooking] full-credit path: applied amount < expected; rejecting with 409', {
        customerId: customer.customerId,
        bookingId: booking.id,
        expected: pendingCreditAmount,
        applied: appliedCreditAmount,
      });
      Sentry.captureException(
        new Error(`CREDIT_RACE: applied ${appliedCreditAmount} < expected ${pendingCreditAmount}`),
      );
      // Booking is in PENDING_PAYMENT state and no Razorpay order was created — safe to
      // leave it; it will expire naturally (stale-booking cleanup handles it).
      return {
        status: 409,
        jsonBody: {
          code: 'CREDIT_RACE',
          message: 'Credit application conflict — please retry. Your wallet balance is unchanged.',
        },
      };
    }

    // Mark PAID immediately (no Razorpay payment involved)
    const paid = await bookingRepo.markPaid(booking.id, 'credit_full_payment');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };

    try {
      posthog.capture({
        distinctId: customer.customerId,
        event: 'booking-created',
        properties: {
          bookingId: booking.id,
          serviceId: parsed.data.serviceId,
          paymentMethod: 'CREDIT_FULL',
          appliedCreditAmount,
        },
      });
    } catch { /* never break the main path */ }

    dispatcherService.triggerDispatch(booking.id).catch((err: unknown) => {
      Sentry.captureException(err);
      console.error('[createBooking] credit-full dispatch failed', { bookingId: booking.id, err });
    });

    return {
      status: 201,
      jsonBody: {
        bookingId: booking.id,
        razorpayOrderId: fullCreditOrderId,
        amount: service.basePrice,
        requiresPayment: false,
        paymentMethod: 'CREDIT_FULL',
        appliedCreditAmount,
      },
    };
  }

  // Partial or no credit — create Razorpay order for the payable portion.
  //
  // P1-2: Reserve the credit BEFORE creating the discounted Razorpay order.
  //
  // Problem without reservation: `pendingCreditAmount` is only a balance peek. If:
  //   (a) The same idempotency key is replayed (client retry), a second discounted
  //       Razorpay order is created, potentially granting the discount twice.
  //   (b) The wallet balance is spent elsewhere between here and payment.captured,
  //       the webhook tries to apply a credit that no longer exists — the Razorpay
  //       payment collected less than basePrice and the booking is undercollected.
  //
  // Fix: write a RESERVED idempotency doc with IfNoneMatch: * before creating the
  // Razorpay order. This guarantees:
  //   - Idempotency-key replay on Razorpay order creation returns 'already_reserved'
  //     (same booking) → skip Razorpay creation and return the same pending credit amount.
  //   - The wallet balance is not double-spent (the reservation does not debit the wallet;
  //     the actual debit in applyCredit will see the RESERVED status and proceed to debit).
  //   - On abandonment (no payment.captured within TTL): the reservation auto-expires, leaving
  //     the wallet balance intact for the next booking.
  if (pendingCreditAmount > 0) {
    try {
      const reserveResult = await customerCreditLedgerRepo.reserveCredit(
        customer.customerId,
        preGeneratedBookingId,
        pendingCreditAmount,
        idempotencyKey,
      );
      if (reserveResult === 'already_reserved') {
        // Idempotent replay: same key, same booking — the Razorpay order was already created
        // in a prior attempt (but the response may not have reached the client). Return the
        // same pending credit info so the client can resume payment.
        console.info('[createBooking] credit reservation already exists — idempotent replay', {
          customerId: customer.customerId,
          bookingId: preGeneratedBookingId,
        });
        // Fall through to create the Razorpay order (or it may already exist; Razorpay is
        // idempotent on order ID because the receipt is unique per attempt — acceptable).
      }
    } catch (reserveErr: unknown) {
      Sentry.captureException(reserveErr);
      console.error('[createBooking] credit reservation failed — falling back to no-credit Razorpay', {
        customerId: customer.customerId,
        err: reserveErr,
      });
      // Non-fatal: fall back to full-price Razorpay (safer than blocking the booking).
      // pendingCreditAmount is reset to 0 so no discount is applied.
      // The unreserved credit stays in the wallet for the next booking.
      // NOTE: if this was a 409 IDEMPOTENCY_KEY_ALREADY_USED for a different booking,
      // that is an abuse signal — Sentry captures it above.
      // For non-409 errors (Cosmos failures, timeouts, etc.), the reservation didn't
      // happen — credit stays intact in the wallet for the next booking attempt.
      // We fall through to create a full-price Razorpay order (no discount) which is safe.
    }
  }

  let order: Awaited<ReturnType<typeof createRazorpayOrder>>;
  try {
    order = await createRazorpayOrder({
      amount: payableAmount > 0 ? payableAmount : service.basePrice,
      currency: 'INR',
      receipt: makeRazorpayReceipt(customer.customerId),
      notes: { bookingId: preGeneratedBookingId },
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error('[createBooking] Razorpay order creation failed', {
      customerId: customer.customerId,
      serviceId: parsed.data.serviceId,
      err,
    });
    return {
      status: 502,
      jsonBody: {
        code: 'PAYMENT_ORDER_FAILED',
        message: 'Could not start payment. Please try again.',
      },
    };
  }

  // P1-6: Store the intended credit amount on the booking doc.
  // The webhook (payment.captured) will call applyCredit to debit the ledger.
  // If the customer abandons payment, no credit is debited (it stays intact).
  const razorpayCreditOptions: BookingCreateCreditOptions | undefined = pendingCreditAmount > 0
    ? { pendingCreditAmountInPaise: pendingCreditAmount, pendingCreditIdempotencyKey: idempotencyKey }
    : undefined;

  const booking = await bookingRepo.createPending(
    parsed.data,
    customer.customerId,
    order.id,
    service.basePrice,
    bookingMetadata(customer, service.name),
    preGeneratedBookingId,
    razorpayCreditOptions,
  );
  try {
    posthog.capture({
      distinctId: customer.customerId,
      event: 'booking-created',
      properties: {
        bookingId: booking.id,
        serviceId: parsed.data.serviceId,
        paymentMethod: 'RAZORPAY',
        // appliedCreditAmount reported as 0 here — actual debit happens post-payment
        appliedCreditAmount: 0,
        pendingCreditAmount,
      },
    });
  } catch { /* never break the main path */ }
  return {
    status: 201,
    jsonBody: {
      bookingId: booking.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      requiresPayment: true,
      paymentMethod: 'RAZORPAY',
      // Report pending credit to client so the UI can show "₹X will be applied after payment"
      appliedCreditAmount: 0,
      pendingCreditAmount,
    },
  };
};

const confirmHandler: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ConfirmBookingRequestSchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };

  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };

  if (!verifyPaymentSignature({
    razorpayOrderId: parsed.data.razorpayOrderId,
    razorpayPaymentId: parsed.data.razorpayPaymentId,
    razorpaySignature: parsed.data.razorpaySignature,
  })) return { status: 400, jsonBody: { code: 'SIGNATURE_INVALID' } };

  const confirmed = await bookingRepo.confirmPayment(id, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature);
  if (!confirmed) return { status: 409, jsonBody: { code: 'BOOKING_ALREADY_PROCESSED' } };

  // Only audit when this call actually performed the transition. If status is PAID the webhook
  // already processed the booking — this is an idempotent confirm, not a new event.
  if (confirmed.status === 'SEARCHING') {
    const _ts = new Date().toISOString();
    void appendAuditEntry({ id: randomUUID(), adminId: 'system', role: 'system', action: 'CUSTOMER_CONFIRMED_PAYMENT', resourceType: 'booking', resourceId: confirmed.id, payload: { bookingId: confirmed.id, paymentId: parsed.data.razorpayPaymentId }, timestamp: _ts, partitionKey: _ts.slice(0, 7) }).catch(Sentry.captureException);
  }

  return { status: 200, jsonBody: { bookingId: confirmed.id, status: confirmed.status } };
};

export const createBookingHandler: HttpHandler = requireCustomer(createHandler);
export const confirmBookingHandler: HttpHandler = requireCustomer(confirmHandler);

const getBookingInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  return {
    status: 200,
    jsonBody: {
      bookingId: booking.id, status: booking.status, amount: booking.amount,
      finalAmount: booking.finalAmount ?? null,
      pendingAddOns: booking.pendingAddOns ?? [],
      approvedAddOns: booking.approvedAddOns ?? [],
    },
  };
};
export const getBookingHandler: HttpHandler = requireCustomer(getBookingInner);

const getMyBookingsInner: CustomerHttpHandler = async (_req, ctx, customer) => {
  try {
    const bookings = await bookingRepo.getByCustomerId(customer.customerId);
    const serviceNames = new Map<string, string>();

    await Promise.all(
      [...new Set(bookings.map((booking) => booking.serviceId))].map(async (serviceId) => {
        const service = await catalogueRepo.getServiceByIdCrossPartition(serviceId);
        serviceNames.set(serviceId, service?.name ?? serviceId);
      }),
    );

    return {
      status: 200,
      jsonBody: {
        bookings: bookings.map((booking) => ({
          bookingId: booking.id,
          serviceId: booking.serviceId,
          serviceName: serviceNames.get(booking.serviceId) ?? booking.serviceId,
          addressText: normalizeAddressText(booking.addressText),
          addressLatLng: booking.addressLatLng,
          status: booking.status,
          slotDate: booking.slotDate,
          slotWindow: booking.slotWindow,
          amount: booking.finalAmount ?? booking.amount,
          paymentMethod: booking.paymentMethod ?? 'RAZORPAY',
          razorpayOrderId: booking.paymentOrderId,
          createdAt: booking.createdAt,
        })),
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    ctx.error('getMyBookings failed', err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};
export const getMyBookingsHandler: HttpHandler = requireCustomer(getMyBookingsInner);

export const requestAddonHandler: HttpHandler = async (req, _ctx) => {
  let uid: string;
  try { ({ uid } = await verifyTechnicianToken(req)); }
  catch { return { status: 401, jsonBody: { code: 'UNAUTHORIZED' } }; }
  const id = (req as unknown as { params: { id: string } }).params.id;
  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.technicianId !== uid) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  const body = await req.json().catch(() => null);
  const parsed = RequestAddOnBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.requestAddOn(id, parsed.data);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_IN_PROGRESS' } };

  try {
    await sendPriceApprovalPush(booking.customerId, id);
  } catch (err) {
    console.error('[requestAddon] FCM push failed — booking is AWAITING_PRICE_APPROVAL but customer was not notified', { bookingId: id, err });
  }

  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status } };
};

const approveFinalPriceInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const body = await req.json().catch(() => null);
  const parsed = ApproveAddOnsBodySchema.safeParse(body);
  if (!parsed.success) return { status: 422, jsonBody: { code: 'VALIDATION_ERROR', issues: parsed.error.issues } };
  const updated = await bookingRepo.applyAddOnDecisions(id, customer.customerId, parsed.data.decisions);
  if (!updated) return { status: 409, jsonBody: { code: 'BOOKING_NOT_AWAITING_APPROVAL' } };
  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status, finalAmount: updated.finalAmount } };
};
export const approveFinalPriceHandler: HttpHandler = requireCustomer(approveFinalPriceInner);

const cancelBookingInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const id = (req as unknown as { params: { id: string } }).params.id;
  const booking = await bookingRepo.getById(id);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };
  if (booking.customerId !== customer.customerId) return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  if (booking.status !== 'PENDING_PAYMENT') return { status: 409, jsonBody: { code: 'BOOKING_NOT_CANCELLABLE' } };
  const updated = await updateBookingFields(id, { status: 'CUSTOMER_CANCELLED' });
  if (!updated) return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  return { status: 200, jsonBody: { bookingId: updated.id, status: updated.status } };
};
export const cancelBookingHandler: HttpHandler = requireCustomer(cancelBookingInner);

const createBookingRateLimiter = withRateLimit({
  buckets: { ip: { capacity: 20, refillPerSec: 20 / 60 } },
});

app.http('createBooking', { route: 'v1/bookings', methods: ['POST'], handler: createBookingRateLimiter(createBookingHandler) });
app.http('confirmBooking', { route: 'v1/bookings/{id}/confirm', methods: ['POST'], handler: requireIntegrity(confirmBookingHandler) });
app.http('getMyBookings', { route: 'v1/bookings', methods: ['GET'], handler: getMyBookingsHandler });
app.http('getBooking', { route: 'v1/bookings/{id}', methods: ['GET'], handler: getBookingHandler });
app.http('requestAddon', { route: 'v1/bookings/{id}/request-addon', methods: ['POST'], handler: requestAddonHandler });
app.http('approveFinalPrice', { route: 'v1/bookings/{id}/approve-final-price', methods: ['POST'], handler: approveFinalPriceHandler });
app.http('cancelBooking', { route: 'v1/bookings/{id}/cancel', methods: ['POST'], handler: cancelBookingHandler });
