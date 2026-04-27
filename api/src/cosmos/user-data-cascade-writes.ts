/**
 * Cascade write facade for DPDP §12 right-to-erasure.
 * Hard-deletes PII categories that cannot be retained (KYC, technician profile);
 * anonymizes everything else (bookings, ratings, ledger, audit log) so financial
 * traceability and audit immutability invariants are preserved.
 *
 * Each method is idempotent — safe to retry after a partial failure.
 */
import {
  getCosmosClient,
  DB_NAME,
  getBookingsContainer,
  getRatingsContainer,
  getWalletLedgerContainer,
  getDispatchAttemptsContainer,
  getBookingEventsContainer,
} from './client.js';

const TECHNICIANS_CONTAINER = 'technicians';
const COMPLAINTS_CONTAINER = 'complaints';
const AUDIT_LOG_CONTAINER = 'audit_log';

const DELETED_ADDRESS_TEXT = '[deleted]';
const DELETED_LATLNG = { lat: 0, lng: 0 };

function isCosmos404(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 404;
}

export const userDataCascadeWrites = {
  async hardDeleteTechnician(uid: string): Promise<boolean> {
    try {
      await getCosmosClient()
        .database(DB_NAME)
        .container(TECHNICIANS_CONTAINER)
        .item(uid, uid)
        .delete();
      return true;
    } catch (err) {
      if (isCosmos404(err)) return false;
      throw err;
    }
  },

  /**
   * Replace bookings authored or fulfilled by the user with anonymized stubs.
   * Booking record is retained for finance/legal traceability; PII fields are stripped.
   */
  async anonymizeBookings(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getBookingsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      updated['addressText'] = DELETED_ADDRESS_TEXT;
      updated['addressLatLng'] = DELETED_LATLNG;
      // photos may contain PII (faces); drop the URLs
      delete updated['photos'];
      // internalNotes may reference user identity in admin commentary
      updated['internalNotes'] = [];
      const id = r['id'] as string;
      await getBookingsContainer().item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Strip free-text comments while keeping the numeric rating (anonymous aggregate).
   * §AC-4: "the only way to honor DPDP without destroying the platform's rating average".
   */
  async anonymizeRatings(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getRatingsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      delete updated['customerComment'];
      delete updated['techComment'];
      const id = r['id'] as string;
      await getRatingsContainer().item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  async anonymizeComplaints(uid: string, anonymizedHash: string): Promise<number> {
    const container = getCosmosClient().database(DB_NAME).container(COMPLAINTS_CONTAINER);
    const { resources } = await container
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.customerId = @uid OR c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['customerId'] === uid) updated['customerId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      if (r['technicianId'] === uid) updated['technicianId'] = `deleted-${anonymizedHash.slice(0, 16)}`;
      // Description is free-text PII
      updated['description'] = '[deleted]';
      delete updated['photoStoragePath'];
      const id = r['id'] as string;
      await container.item(id, id).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Wallet ledger is retained for 7 years per RBI/finance regulation.
   * Anonymize technicianId only; do NOT delete entries.
   *
   * Partition key changes from `technicianId = uid` to `technicianId = hash`,
   * so we use insert-then-delete with idempotent guards: if a prior attempt
   * created the new doc but failed to delete the old, the next pass tolerates
   * Cosmos 409 (already-created) on insert and 404 (already-deleted) on delete.
   */
  async anonymizeWalletLedger(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getWalletLedgerContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = {
        ...r,
        technicianId: anonId,
        partitionKey: anonId,
      };
      const id = r['id'] as string;
      // Insert first — anonymized doc lives in new partition. Idempotent on 409.
      try {
        await getWalletLedgerContainer().items.create(updated);
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code !== 409) throw err;
      }
      // Then delete the original. Idempotent on 404.
      try {
        await getWalletLedgerContainer().item(id, uid).delete();
      } catch (err) {
        if (!isCosmos404(err)) throw err;
      }
      n += 1;
    }
    return n;
  },

  async anonymizeBookingEvents(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getBookingEventsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.technicianId = @uid OR c.adminId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r };
      if (r['technicianId'] === uid) updated['technicianId'] = anonId;
      if (r['adminId'] === uid) updated['adminId'] = anonId;
      const id = r['id'] as string;
      const pk = (r['bookingId'] as string) ?? id;
      await getBookingEventsContainer().item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  async anonymizeDispatchAttempts(uid: string, anonymizedHash: string): Promise<number> {
    const { resources } = await getDispatchAttemptsContainer()
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(c.technicianIds, @uid)',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const ids = r['technicianIds'] as string[];
      const updated: Record<string, unknown> = {
        ...r,
        technicianIds: ids.map((t) => (t === uid ? anonId : t)),
      };
      const id = r['id'] as string;
      const pk = (r['bookingId'] as string) ?? id;
      await getDispatchAttemptsContainer().item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Audit log immutability invariant: NEVER delete audit entries.
   * Only the resourceId field is anonymized so the entries remain queryable
   * by the operator while no longer linking back to the natural-person uid.
   */
  async anonymizeAuditLogResourceId(uid: string, anonymizedHash: string): Promise<number> {
    const container = getCosmosClient().database(DB_NAME).container(AUDIT_LOG_CONTAINER);
    const { resources } = await container
      .items.query<Record<string, unknown>>({
        query: 'SELECT * FROM c WHERE c.resourceId = @uid',
        parameters: [{ name: '@uid', value: uid }],
      })
      .fetchAll();
    let n = 0;
    const anonId = `deleted-${anonymizedHash.slice(0, 16)}`;
    for (const r of resources) {
      const updated: Record<string, unknown> = { ...r, resourceId: anonId };
      const id = r['id'] as string;
      const pk = (r['partitionKey'] as string) ?? '';
      await container.item(id, pk).replace(updated);
      n += 1;
    }
    return n;
  },

  /**
   * Clear FCM token from technician doc (best-effort; customer FCM is topic-based,
   * so nothing per-document to clear — we return a flag for the inventory check).
   */
  async clearFcmTokenForTechnician(uid: string): Promise<boolean> {
    const container = getCosmosClient().database(DB_NAME).container(TECHNICIANS_CONTAINER);
    try {
      const { resource } = await container.item(uid, uid).read<Record<string, unknown>>();
      if (!resource) return false;
      const updated: Record<string, unknown> = { ...resource };
      delete updated['fcmToken'];
      await container.item(uid, uid).replace(updated);
      return true;
    } catch (err) {
      if (isCosmos404(err)) return false;
      throw err;
    }
  },
};
