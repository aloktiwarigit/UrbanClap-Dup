'use client';

import { useState, useCallback } from 'react';
import { patchComplaintClient } from '@/api/complaints';
import { KanbanBoard } from '@/components/complaints/KanbanBoard';
import type { Complaint, ComplaintResolutionCategory, ComplaintStatus } from '@/types/complaint';

interface ComplaintsClientProps {
  initialComplaints: Complaint[];
  totalComplaints: number;
}

export function ComplaintsClient({ initialComplaints, totalComplaints }: ComplaintsClientProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback(async (id: string, status: ComplaintStatus) => {
    let prevStatus: ComplaintStatus | undefined;
    setComplaints((prev) => {
      const c = prev.find((x) => x.id === id);
      prevStatus = c?.status;
      return prev.map((x) => (x.id === id ? { ...x, status, updatedAt: new Date().toISOString() } : x));
    });
    try {
      await patchComplaintClient(id, { status });
    } catch (err) {
      if (prevStatus !== undefined) {
        setComplaints((prev) => prev.map((x) => (x.id === id ? { ...x, status: prevStatus! } : x)));
      }
      setError(String(err));
    }
  }, []);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    let prevNotes: Complaint['internalNotes'] | undefined;
    setComplaints((prev) => {
      const c = prev.find((x) => x.id === id);
      prevNotes = c?.internalNotes;
      return prev.map((x) =>
        x.id === id
          ? {
              ...x,
              internalNotes: [
                ...x.internalNotes,
                { note, adminId: 'me', createdAt: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : x,
      );
    });
    try {
      const updated = await patchComplaintClient(id, { note });
      // Merge: take server-confirmed notes, then append any optimistic notes added
      // after this request was dispatched (notes at indices >= server list length).
      setComplaints((prev) =>
        prev.map((x) => {
          if (x.id !== id) return x;
          const newerOptimistic = x.internalNotes.slice(updated.internalNotes.length);
          return { ...x, internalNotes: [...updated.internalNotes, ...newerOptimistic] };
        }),
      );
    } catch (err) {
      if (prevNotes !== undefined) {
        setComplaints((prev) => prev.map((x) => (x.id === id ? { ...x, internalNotes: prevNotes! } : x)));
      }
      setError(String(err));
    }
  }, []);

  const handleReassign = useCallback(async (id: string, assigneeAdminId: string | null) => {
    let prevAssignee: string | undefined;
    setComplaints((prev) => {
      const c = prev.find((x) => x.id === id);
      prevAssignee = c?.assigneeAdminId;
      return prev.map((x) => {
        if (x.id !== id) return x;
        const { assigneeAdminId: _a, ...base } = x;
        return assigneeAdminId !== null ? { ...base, assigneeAdminId, updatedAt: new Date().toISOString() } : { ...base, updatedAt: new Date().toISOString() };
      });
    });
    try {
      await patchComplaintClient(id, { assigneeAdminId });
    } catch (err) {
      setComplaints((prev) => prev.map((x) => {
        if (x.id !== id) return x;
        const { assigneeAdminId: _a, ...base } = x;
        return prevAssignee !== undefined ? { ...base, assigneeAdminId: prevAssignee } : base;
      }));
      setError(String(err));
    }
  }, []);

  const handleResolve = useCallback(async (id: string, resolutionCategory: ComplaintResolutionCategory) => {
    let prevStatus: ComplaintStatus | undefined;
    let prevCategory: ComplaintResolutionCategory | undefined;
    setComplaints((prev) => {
      const c = prev.find((x) => x.id === id);
      prevStatus = c?.status;
      prevCategory = c?.resolutionCategory;
      return prev.map((x) =>
        x.id === id
          ? { ...x, status: 'RESOLVED', resolutionCategory, updatedAt: new Date().toISOString() }
          : x,
      );
    });
    try {
      await patchComplaintClient(id, { status: 'RESOLVED', resolutionCategory });
    } catch (err) {
      if (prevStatus !== undefined) {
        setComplaints((prev) =>
          prev.map((x) => {
            if (x.id !== id) return x;
            const { resolutionCategory: _r, ...base } = x;
            return prevCategory !== undefined
              ? { ...base, status: prevStatus!, resolutionCategory: prevCategory }
              : { ...base, status: prevStatus! };
          }),
        );
      }
      setError(String(err));
    }
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Complaints</h1>
        <span className="text-sm text-gray-500">
          {totalComplaints > complaints.length
            ? `${complaints.length} of ${totalComplaints} loaded`
            : `${totalComplaints} total`}
        </span>
      </div>

      {error && (
        <p className="text-red-600 my-4 text-sm">{error}</p>
      )}

      <KanbanBoard
        complaints={complaints}
        onStatusChange={(id, status) => { void handleStatusChange(id, status); }}
        onAddNote={(id, note) => { void handleAddNote(id, note); }}
        onReassign={(id, adminId) => { void handleReassign(id, adminId); }}
        onResolve={(id, category) => { void handleResolve(id, category); }}
      />
    </div>
  );
}
