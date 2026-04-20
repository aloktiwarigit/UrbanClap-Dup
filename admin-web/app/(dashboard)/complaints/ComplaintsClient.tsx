'use client';

import { useState, useCallback } from 'react';
import { createApiClient } from '@/api/client';
import { patchComplaint } from '@/api/complaints';
import { KanbanBoard } from '@/components/complaints/KanbanBoard';
import type { Complaint, ComplaintStatus } from '@/types/complaint';

interface ComplaintsClientProps {
  initialComplaints: Complaint[];
}

function getClientApiClient() {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? '';
  return createApiClient({ baseUrl });
}

export function ComplaintsClient({ initialComplaints }: ComplaintsClientProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback(async (id: string, status: ComplaintStatus) => {
    // Optimistic update
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
    try {
      const client = getClientApiClient();
      await patchComplaint(client, id, { status });
    } catch (err) {
      setError(String(err));
      // Revert on failure
      setComplaints(initialComplaints);
    }
  }, [initialComplaints]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Complaints</h1>
        <span className="text-sm text-gray-500">{complaints.length} total</span>
      </div>

      {error && (
        <p className="text-red-600 my-4 text-sm">{error}</p>
      )}

      <KanbanBoard
        complaints={complaints}
        onStatusChange={(id, status) => {
          void handleStatusChange(id, status);
        }}
      />
    </div>
  );
}
