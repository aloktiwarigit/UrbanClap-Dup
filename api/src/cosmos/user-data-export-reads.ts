/**
 * Read-only aggregation facade for /v1/users/me/data-export (DPDP §11).
 * Lives outside the per-domain repositories to keep PII-export concerns
 * in one auditable place. Add new fields here whenever a new container
 * holds PII tied to a customer/technician uid.
 */
import { getCosmosClient, DB_NAME, getBookingsContainer, getRatingsContainer, getWalletLedgerContainer, getDispatchAttemptsContainer, getBookingEventsContainer } from './client.js';
import { BookingDocSchema } from '../schemas/booking.js';
import { RatingDocSchema } from '../schemas/rating.js';
import { ComplaintDocSchema } from '../schemas/complaint.js';
import { WalletLedgerEntrySchema } from '../schemas/wallet-ledger.js';
import { BookingEventDocSchema } from '../schemas/booking-event.js';
import { DispatchAttemptDocSchema } from '../schemas/dispatch-attempt.js';
import { AuditLogEntrySchema } from '../schemas/audit-log.js';
import type { BookingDoc } from '../schemas/booking.js';
import type { RatingDoc } from '../schemas/rating.js';
import type { ComplaintDoc } from '../schemas/complaint.js';
import type { WalletLedgerEntry } from '../schemas/wallet-ledger.js';
import type { BookingEventDoc } from '../schemas/booking-event.js';
import type { DispatchAttemptDoc } from '../schemas/dispatch-attempt.js';
import type { AuditLogEntry } from '../schemas/audit-log.js';
import type { TechnicianKyc } from '../schemas/kyc.js';
import type { TechnicianProfile } from '../schemas/technician.js';

const COMPLAINTS_CONTAINER = 'complaints';
const TECHNICIANS_CONTAINER = 'technicians';
const AUDIT_LOG_CONTAINER = 'audit_log';

export interface TechnicianFullExportDoc {
  profile: TechnicianProfile | null;
  kyc: TechnicianKyc | null;
  fcmToken: string | null;
}

async function listBookingsByCustomer(uid: string): Promise<BookingDoc[]> {
  const { resources } = await getBookingsContainer()
    .items.query<Record<string, unknown>>({
      query: 'SELECT * FROM c WHERE c.customerId = @uid',
      parameters: [{ name: '@uid', value: uid }],
    })
    .fetchAll();
  return resources.map((r) => BookingDocSchema.parse(r));
}

async function listBookingsByTechnician(uid: string): Promise<BookingDoc[]> {
  const { resources } = await getBookingsContainer()
    .items.query<Record<string, unknown>>({
      query: 'SELECT * FROM c WHERE c.technicianId = @uid',
      parameters: [{ name: '@uid', value: uid }],
    })
    .fetchAll();
  return resources.map((r) => BookingDocSchema.parse(r));
}

async function listRatingsByCustomer(uid: string): Promise<RatingDoc[]> {
  const { resources } = await getRatingsContainer()
    .items.query<Record<string, unknown>>({
      query: 'SELECT * FROM c WHERE c.customerId = @uid',
      parameters: [{ name: '@uid', value: uid }],
    })
    .fetchAll();
  return resources.map((r) => RatingDocSchema.parse(r));
}

async function listRatingsByTechnician(uid: string): Promise<RatingDoc[]> {
  const { resources } = await getRatingsContainer()
    .items.query<Record<string, unknown>>({
      query: 'SELECT * FROM c WHERE c.technicianId = @uid',
      parameters: [{ name: '@uid', value: uid }],
    })
    .fetchAll();
  return resources.map((r) => RatingDocSchema.parse(r));
}

export const userDataExportReads = {
  async listBookingsForUser(uid: string, role: 'CUSTOMER' | 'TECHNICIAN'): Promise<BookingDoc[]> {
    return role === 'CUSTOMER' ? listBookingsByCustomer(uid) : listBookingsByTechnician(uid);
  },

  async listRatingsForUser(uid: string, role: 'CUSTOMER' | 'TECHNICIAN'): Promise<RatingDoc[]> {
    return role === 'CUSTOMER' ? listRatingsByCustomer(uid) : listRatingsByTechnician(uid);
  },

  async listComplaintsForUser(uid: string): Promise<ComplaintDoc[]> {
    const { resources } = await getCosmosClient()
      .database(DB_NAME)
      .container(COMPLAINTS_CONTAINER)
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    return resources.map((r) => ComplaintDocSchema.parse(r));
  },

  async listWalletLedgerForTechnician(uid: string): Promise<WalletLedgerEntry[]> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    return resources.map((r) => WalletLedgerEntrySchema.parse(r));
  },

  async listBookingEventsForUser(uid: string): Promise<BookingEventDoc[]> {
    const { resources } = await getBookingEventsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid OR c.adminId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    return resources.map((r) => BookingEventDocSchema.parse(r));
  },

  async listDispatchAttemptsForUser(uid: string): Promise<DispatchAttemptDoc[]> {
    const { resources } = await getDispatchAttemptsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    return resources.map((r) => DispatchAttemptDocSchema.parse(r));
  },

  async readTechnicianFullDoc(uid: string): Promise<TechnicianFullExportDoc> {
    const { resource } = await getCosmosClient()
      .database(DB_NAME)
      .container(TECHNICIANS_CONTAINER)
      .item(uid, uid)
      .read<Record<string, unknown>>();
    if (!resource) return { profile: null, kyc: null, fcmToken: null };
    const r = resource as {
      kyc?: TechnicianKyc;
      fcmToken?: string;
    } & Record<string, unknown>;
    const { kyc, fcmToken, ...rest } = r;
    return {
      profile: rest as unknown as TechnicianProfile,
      kyc: kyc ?? null,
      fcmToken: fcmToken ?? null,
    };
  },

  async listAuditLogForUser(uid: string, sinceIso: string): Promise<AuditLogEntry[]> {
    const { resources } = await getCosmosClient()
      .database(DB_NAME)
      .container(AUDIT_LOG_CONTAINER)
      .items.query<Record<string, unknown>>({
        query:
          'SELECT * FROM c WHERE c.resourceId = @uid AND c.timestamp >= @since ORDER BY c.timestamp DESC',
        parameters: [
          { name: '@uid', value: uid },
          { name: '@since', value: sinceIso },
        ],
      })
      .fetchAll();
    return resources.map((r) => AuditLogEntrySchema.parse(r));
  },
};
