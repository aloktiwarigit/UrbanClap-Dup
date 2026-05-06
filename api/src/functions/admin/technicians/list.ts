import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { listAllTechniciansForAdmin } from '../../../cosmos/technician-repository.js';
import { getActiveBookingCountForTechnician } from '../../../cosmos/booking-repository.js';
import type { AdminTechnician } from '../../../schemas/admin-technician.js';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '••••••••••';
  return `+91 XXXXX-X${phone.slice(-4)}`;
}

function mapKycStatus(raw?: string): AdminTechnician['kycStatus'] {
  if (raw === 'APPROVED') return 'VERIFIED';
  if (raw === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}

function mapStatus(doc: { isOnline?: boolean; suspended?: boolean }): AdminTechnician['status'] {
  if (doc.suspended) return 'SUSPENDED';
  if (doc.isOnline) return 'ON_DUTY';
  return 'OFF_DUTY';
}

export async function adminListTechniciansHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const docs = await listAllTechniciansForAdmin();
  if (docs.length === 0) return { status: 200, jsonBody: { technicians: [] } };

  // Import firebase-admin lazily to avoid cold-start cost when list is empty
  const firebaseAdmin = await import('firebase-admin');
  const firebaseApp = firebaseAdmin.app();
  const { users } = await firebaseApp.auth().getUsers(
    docs.map((d) => ({ uid: d.id })),
  );
  const authMap = new Map(users.map((u) => [u.uid, u]));

  const counts = await Promise.all(
    docs.map((d) => getActiveBookingCountForTechnician(d.id).catch(() => 0)),
  );

  const technicians: AdminTechnician[] = docs.map((doc, i) => {
    const authUser = authMap.get(doc.id);
    const rawPhone = authUser?.phoneNumber ?? '';
    return {
      id: doc.id,
      name: doc.displayName ?? doc.name ?? authUser?.displayName ?? doc.id,
      phone: maskPhone(rawPhone),
      status: mapStatus(doc),
      kycStatus: mapKycStatus(doc.kycStatus),
      serviceCategories: doc.skills ?? [],
      commissionPct: doc.commissionPct ?? 20,
      activeBookingCount: counts[i] ?? 0,
      lastActiveAt: doc.updatedAt,
    };
  });

  return { status: 200, jsonBody: { technicians } };
}

app.http('adminListTechnicians', {
  methods: ['GET'],
  route: 'v1/admin/technicians',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListTechniciansHandler),
});
