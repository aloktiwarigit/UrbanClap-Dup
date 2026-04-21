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
    let original: Complaint | undefined;
    setComplaints((prev) => {
      original = prev.find((c) => c.id === id);
      return prev.map((c) => (c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
    });
    try {
      await patchComplaintClient(id, { status });
    } catch (err) {
      if (original) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? original! : c)));
      }
      setError(String(err));
    }
  }, []);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    let original: Complaint | undefined;
    setComplaints((prev) => {
      original = prev.find((c) => c.id === id);
      return prev.map((c) =>
        c.id === id
          ? {
              ...c,
              internalNotes: [
                ...c.internalNotes,
                { note, adminId: 'me', createdAt: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : c,
      );
    });
    try {
      const updated = await patchComplaintClient(id, { note });
      // Replace optimistic entry with server response (correct adminId + server timestamp)
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      if (original) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? original! : c)));
      }
      setError(String(err));
    }
  }, []);

  const handleReassign = useCallback(async (id: string, assigneeAdminId: string) => {
    let original: Complaint | undefined;
    setComplaints((prev) => {
      original = prev.find((c) => c.id === id);
      return prev.map((c) =>
        c.id === id ? { ...c, assigneeAdminId, updatedAt: new Date().toISOString() } : c,
      );
    });
    try {
      await patchComplaintClient(id, { assigneeAdminId });
    } catch (err) {
      if (original) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? original! : c)));
      }
      setError(String(err));
    }
  }, []);

  const handleResolve = useCallback(async (id: string, resolutionCategory: ComplaintResolutionCategory) => {
    let original: Complaint | undefined;
    setComplaints((prev) => {
      original = prev.find((c) => c.id === id);
      return prev.map((c) =>
        c.id === id
          ? { ...c, status: 'RESOLVED', resolutionCategory, updatedAt: new Date().toISOString() }
          : c,
      );
    });
    try {
      await patchComplaintClient(id, { status: 'RESOLVED', resolutionCategory });
    } catch (err) {
      if (original) {
        setComplaints((prev) => prev.map((c) => (c.id === id ? original! : c)));
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
