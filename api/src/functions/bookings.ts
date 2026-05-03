import { randomUUID } from 'node:crypto';
import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { CreateBookingRequestSchema, ConfirmBookingRequestSchema } from '../schemas/booking.js';
import { RequestAddOnBodySchema, ApproveAddOnsBodySchema } from '../schemas/addon-approval.js';
import { bookingRepo } from '../cosmos/booking-repository.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpay.service.js';
import { catalogueRepo } from '../cosmos/catalogue-repository.js';
import { verifyTechnicianToken } from '../middleware/verifyTechnicianToken.js';
import { sendPriceApprovalPush } from '../services/fcm.service.js';
import { appendAuditEntry } from '../cosmos/audit-log-repository.js';
import { isSoftLaunchEnabled, isMarketingPaused } from '../services/featureFlags.service.js';
import { dispatcherService } from '../services/dispatcher.service.js';

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

  const service = await catalogueRepo.getServiceByIdCrossPartition(parsed.data.serviceId);
  if (!service || !service.isActive) return { status: 404, jsonBody: { code: 'SERVICE_NOT_FOUND' } };

  if (parsed.data.paymentMethod === 'CASH_ON_SERVICE') {
    const cashOrderId = `cash_${randomUUID()}`;
    const booking = await bookingRepo.createPending(parsed.data, customer.customerId, cashOrderId, service.basePrice);
    const paid = await bookingRepo.markPaid(booking.id, 'cash_on_service_pending');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
    dispatcherService.triggerDispatch(booking.id).catch((err) => {
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
      },
    };
  }

  if (!hasRazorpayCredentials()) {
    const manualOrderId = `manual_${randomUUID()}`;
    const manualRequest = { ...parsed.data, paymentMethod: 'CASH_ON_SERVICE' as const };
    const booking = await bookingRepo.createPending(manualRequest, customer.customerId, manualOrderId, service.basePrice);
    const paid = await bookingRepo.markPaid(booking.id, 'manual_payment_not_configured');
    if (!paid) return { status: 500, jsonBody: { code: 'BOOKING_CONFIRMATION_FAILED' } };
    dispatcherService.triggerDispatch(booking.id).catch((err) => {
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
      },
    };
  }

  let order: Awaited<ReturnType<typeof createRazorpayOrder>>;
  try {
    order = await createRazorpayOrder({
      amount: service.basePrice,
      currency: 'INR',
      receipt: makeRazorpayReceipt(customer.customerId),
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

  const booking = await bookingRepo.createPending(parsed.data, customer.customerId, order.id, service.basePrice);
  return { status: 201, jsonBody: { bookingId: booking.id, razorpayOrderId: order.id, amount: order.amount, requiresPayment: true, paymentMethod: 'RAZORPAY' } };
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

app.http('createBooking', { route: 'v1/bookings', methods: ['POST'], handler: createBookingHandler });
app.http('confirmBooking', { route: 'v1/bookings/{id}/confirm', methods: ['POST'], handler: confirmBookingHandler });
app.http('getBooking', { route: 'v1/bookings/{id}', methods: ['GET'], handler: getBookingHandler });
app.http('requestAddon', { route: 'v1/bookings/{id}/request-addon', methods: ['POST'], handler: requestAddonHandler });
app.http('approveFinalPrice', { route: 'v1/bookings/{id}/approve-final-price', methods: ['POST'], handler: approveFinalPriceHandler });
