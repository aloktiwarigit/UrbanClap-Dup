/**
 * Wallet HTTP handlers — E13-S01 (ADR-0017)
 *
 *   GET /v1/wallet/balance  → { balanceInPaise, lastUpdatedAt }
 *   GET /v1/wallet/ledger   → { entries[], total, page, limit }
 *
 * Auth: customer-only (Firebase ID token via requireCustomer middleware).
 * All monetary values in paise (1 INR = 100 paise).
 *
 * See: docs/adr/0017-customer-wallet-ledger.md, threat-model S-W1.
 */

import type { HttpHandler } from '@azure/functions';
import { app } from '@azure/functions';
import * as Sentry from '@sentry/node';
import { requireCustomer, type CustomerHttpHandler } from '../middleware/requireCustomer.js';
import { customerCreditLedgerRepo } from '../cosmos/customer-credit-ledger-repository.js';

// ---------------------------------------------------------------------------
// GET /v1/wallet/balance
// ---------------------------------------------------------------------------

const getBalanceInner: CustomerHttpHandler = async (_req, _ctx, customer) => {
  try {
    const result = await customerCreditLedgerRepo.getBalance(customer.customerId);
    return {
      status: 200,
      jsonBody: {
        balanceInPaise: result.balanceInPaise,
        lastUpdatedAt: result.lastUpdatedAt,
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

export const getWalletBalanceHandler: HttpHandler = requireCustomer(getBalanceInner);

// ---------------------------------------------------------------------------
// GET /v1/wallet/ledger
// ---------------------------------------------------------------------------

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 20;
const LIMIT_MAX = 100;

const getLedgerInner: CustomerHttpHandler = async (req, _ctx, customer) => {
  const url = new URL(req.url);

  const rawPage = parseInt(url.searchParams.get('page') ?? String(PAGE_DEFAULT), 10);
  const rawLimit = parseInt(url.searchParams.get('limit') ?? String(LIMIT_DEFAULT), 10);

  if (!Number.isInteger(rawPage) || rawPage < 1) {
    return { status: 422, jsonBody: { code: 'INVALID_PAGE', message: 'page must be a positive integer' } };
  }
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    return { status: 422, jsonBody: { code: 'INVALID_LIMIT', message: 'limit must be a positive integer' } };
  }

  const page = rawPage;
  const limit = Math.min(rawLimit, LIMIT_MAX);

  try {
    const { entries, total } = await customerCreditLedgerRepo.getLedgerPage(
      customer.customerId,
      page,
      limit,
    );
    return {
      status: 200,
      jsonBody: {
        entries: entries.map((e) => ({
          id: e.id,
          type: e.type,
          amountInPaise: e.amountInPaise,
          ...(e.bookingId !== undefined ? { bookingId: e.bookingId } : {}),
          reason: e.reason,
          createdAt: e.createdAt,
        })),
        total,
        page,
        limit,
      },
    };
  } catch (err: unknown) {
    Sentry.captureException(err);
    return { status: 500, jsonBody: { code: 'INTERNAL_ERROR' } };
  }
};

export const getWalletLedgerHandler: HttpHandler = requireCustomer(getLedgerInner);

// ---------------------------------------------------------------------------
// Route registrations
// ---------------------------------------------------------------------------

app.http('getWalletBalance', {
  route: 'v1/wallet/balance',
  methods: ['GET'],
  handler: getWalletBalanceHandler,
});

app.http('getWalletLedger', {
  route: 'v1/wallet/ledger',
  methods: ['GET'],
  handler: getWalletLedgerHandler,
});
