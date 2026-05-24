import '../../../bootstrap.js';
import { app } from '@azure/functions';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions';
import { requireAdmin, type AdminHttpHandler } from '../../../middleware/requireAdmin.js';
import type { AdminContext } from '../../../types/admin.js';
import { commissionReceivableRepo } from '../../../cosmos/commission-receivable-repository.js';
import { getTechniciansByIds } from '../../../cosmos/technician-repository.js';

export const adminCommissionReceivablesDashboardHandler: AdminHttpHandler = async (
  _req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  try {
    const summaries = await commissionReceivableRepo.getAllTechnicianOutstandingSummaries();
    if (summaries.length === 0) {
      return { status: 200, jsonBody: { technicians: [], totalOutstanding: 0 } };
    }

    const techIds = summaries.map((s) => s.technicianId);
    const techProfiles = await getTechniciansByIds(techIds);
    const nameByTechId = new Map(
      techProfiles.map((t) => [t.technicianId || t.id, t.displayName || t.name || t.technicianId || t.id]),
    );

    const technicians = summaries.map((s) => ({
      technicianId: s.technicianId,
      technicianName: nameByTechId.get(s.technicianId) ?? s.technicianId,
      dueCount: s.dueCount,
      totalCommissionDue: s.totalCommissionDue,
      oldestDueAt: s.oldestDueAt,
    }));
    const totalOutstanding = technicians.reduce((acc, t) => acc + t.totalCommissionDue, 0);

    return { status: 200, jsonBody: { technicians, totalOutstanding } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

export const adminCommissionReceivablesPerTechHandler: AdminHttpHandler = async (
  req: HttpRequest,
  _ctx: InvocationContext,
  _admin: AdminContext,
): Promise<HttpResponseInit> => {
  const technicianId = (req as unknown as { params: { technicianId: string } }).params.technicianId;
  if (!technicianId) return { status: 400, jsonBody: { code: 'MISSING_TECHNICIAN_ID' } };

  try {
    const entries = await commissionReceivableRepo.getOutstandingByTechnician(technicianId);
    return { status: 200, jsonBody: { technicianId, entries } };
  } catch {
    return { status: 502, jsonBody: { code: 'UPSTREAM_ERROR' } };
  }
};

app.http('adminCommissionReceivablesDashboard', {
  methods: ['GET'],
  route: 'v1/admin/finance/commission-receivables',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(adminCommissionReceivablesDashboardHandler),
});

app.http('adminCommissionReceivablesPerTech', {
  methods: ['GET'],
  route: 'v1/admin/finance/commission-receivables/{technicianId}',
  authLevel: 'anonymous',
  handler: requireAdmin(['super-admin', 'finance'])(adminCommissionReceivablesPerTechHandler),
});
