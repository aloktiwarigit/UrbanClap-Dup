import '../../../bootstrap.js';
import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import type { HttpHandler, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { bookingRepo } from '../../../cosmos/booking-repository.js';
import { getKeyDoc } from '../../../cosmos/sos-incident-key-repository.js';
import { getSessionById } from '../../../services/adminSession.service.js';
import { assertTotpFreshness } from '../../../services/totp.service.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import { appendAuditEntry } from '../../../cosmos/audit-log-repository.js';
import type { AuditLogDoc } from '../../../schemas/audit-log.js';

const TOTP_MAX_AGE_MS = 5 * 60_000;
const ALLOWED_ROLES = ['super-admin', 'ops-manager'] as const;

export const adminSosPlaybackTokenHandler: AdminHttpHandler = async (
  req,
  ctx: InvocationContext,
  admin: AdminContext,
) => {
  if (!ALLOWED_ROLES.includes(admin.role as (typeof ALLOWED_ROLES)[number])) {
    return { status: 403, jsonBody: { code: 'FORBIDDEN' } };
  }

  const session = await getSessionById(admin.sessionId);
  if (!session || !assertTotpFreshness(session, TOTP_MAX_AGE_MS)) {
    return { status: 401, jsonBody: { code: 'TOTP_REFRESH_REQUIRED' } };
  }

  const incidentId = (req as unknown as { params: { incidentId: string } }).params.incidentId;

  const booking = await bookingRepo.getById(incidentId);
  if (!booking) return { status: 404, jsonBody: { code: 'BOOKING_NOT_FOUND' } };

  const keyDoc = await getKeyDoc(incidentId, booking.customerId);
  if (!keyDoc) return { status: 404, jsonBody: { code: 'KEY_NOT_FOUND' } };

  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const [signedStorageUrl] = await getFirebaseAdmin()
    .storage()
    .bucket()
    .file(keyDoc.storagePath)
    .getSignedUrl({ action: 'read', expires: expiresAt });

  const now = new Date().toISOString();
  const auditEntry: AuditLogDoc = {
    id: randomUUID(),
    adminId: admin.adminId,
    role: admin.role,
    action: 'SOS_PLAYBACK_TOKEN_ISSUED',
    resourceType: 'booking',
    resourceId: incidentId,
    payload: { adminId: admin.adminId, incidentId },
    timestamp: now,
    partitionKey: now.slice(0, 7),
  };
  appendAuditEntry(auditEntry).catch((err: unknown) => ctx.error('Audit SOS_PLAYBACK_TOKEN_ISSUED failed', err));

  return {
    status: 200,
    jsonBody: {
      incidentId,
      storagePath: keyDoc.storagePath,
      signedStorageUrl,
      keyB64: keyDoc.keyB64,
      ivB64: keyDoc.ivB64,
      signedUrlExpiresAt: expiresAt.toISOString(),
    },
  };
};

const handler: HttpHandler = requireAdmin(['super-admin', 'ops-manager'])(adminSosPlaybackTokenHandler);

app.http('adminSosPlaybackToken', {
  methods: ['GET'],
  route: 'v1/admin/sos/{incidentId}/playback-token',
  authLevel: 'anonymous',
  handler,
});
