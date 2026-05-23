import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { getCustomerSummaries } from '../../../cosmos/booking-repository.js';
import { getCustomerMetadata } from '../../../cosmos/customer-metadata-repository.js';
import { getFirebaseAdmin } from '../../../services/firebaseAdmin.js';
import type { AdminCustomer } from '../../../schemas/admin-customer.js';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '••••••••••';
  return `+91 XXXXX-X${phone.slice(-4)}`;
}

export async function adminListCustomersHandler(
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> {
  const summaries = await getCustomerSummaries();
  if (summaries.length === 0) return { status: 200, jsonBody: { customers: [] } };

  const customerIds = summaries.map((s) => s.customerId);

  const authMap = new Map<string, { displayName?: string; phoneNumber?: string }>();
  try {
    const auth = getFirebaseAdmin().auth();
    for (let i = 0; i < customerIds.length; i += 100) {
      const chunk = customerIds.slice(i, i + 100);
      const { users } = await auth.getUsers(chunk.map((uid) => ({ uid })));
      for (const u of users) {
        const entry: { displayName?: string; phoneNumber?: string } = {};
        if (u.displayName) entry.displayName = u.displayName;
        if (u.phoneNumber) entry.phoneNumber = u.phoneNumber;
        authMap.set(u.uid, entry);
      }
    }
  } catch {
    // Firebase Auth metadata is best-effort; booking summaries still render without it.
  }

  const metadataMap = await getCustomerMetadata(customerIds);

  const customers: AdminCustomer[] = summaries.map((s) => {
    const authUser = authMap.get(s.customerId);
    const meta = metadataMap.get(s.customerId);
    return {
      id: s.customerId,
      name: authUser?.displayName ?? s.customerId,
      phone: maskPhone(authUser?.phoneNumber ?? ''),
      city: s.lastCity ?? '—',
      bookingCount: s.bookingCount,
      lastBookingDate: s.lastBookingDate,
      accountStatus: meta?.flagged ? 'FLAGGED' : 'ACTIVE',
      openComplaintCount: 0,
      recentBookings: s.recentBookings.map((b) => ({
        date: b.date,
        service: b.serviceId,
        techName: b.technicianId,
        status: b.status,
      })),
      recentComplaints: [],
      notes: (meta?.notes ?? []).map((n) => ({ text: n.text, createdAt: n.createdAt, authorName: n.authorName })),
    };
  });

  return { status: 200, jsonBody: { customers } };
}

app.http('adminListCustomers', {
  methods: ['GET'],
  route: 'v1/admin/customers',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'ops-manager'])(adminListCustomersHandler),
});
