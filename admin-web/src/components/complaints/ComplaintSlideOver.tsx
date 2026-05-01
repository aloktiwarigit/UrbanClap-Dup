'use client';

import { useState, useEffect } from 'react';
import type { Complaint, ComplaintStatus, ComplaintResolutionCategory } from '@/types/complaint';

interface ComplaintSlideOverProps {
  complaint: Complaint;
  onClose: () => void;
  onStatusChange: (status: ComplaintStatus) => void;
  onAddNote: (note: string) => void;
  onResolve: (category: ComplaintResolutionCategory) => void;
  onReassign: (adminId: string | null) => void;
}

const RESOLUTION_CATEGORIES: ComplaintResolutionCategory[] = [
  'TECHNICIAN_MISCONDUCT',
  'SERVICE_QUALITY',
  'BILLING_DISPUTE',
  'LATE_ARRIVAL',
  'NO_SHOW',
  'OTHER',
];

// RESOLVED is excluded — use the resolve section below to supply the required resolutionCategory.
const STATUS_OPTIONS: ComplaintStatus[] = ['NEW', 'INVESTIGATING'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ComplaintSlideOver({
  complaint,
  onClose,
  onStatusChange,
  onAddNote,
  onResolve,
  onReassign,
}: ComplaintSlideOverProps) {
  const [noteText, setNoteText] = useState('');
  const [resolutionCategory, setResolutionCategory] = useState<ComplaintResolutionCategory>('OTHER');
  const [reassignInput, setReassignInput] = useState(complaint.assigneeAdminId ?? '');

  useEffect(() => {
    setReassignInput(complaint.assigneeAdminId ?? '');
  }, [complaint.assigneeAdminId]);

  const handleAddNote = () => {
    if (noteText.trim()) {
      onAddNote(noteText.trim());
      setNoteText('');
    }
  };

  const handleResolve = () => {
    onResolve(resolutionCategory);
  };

  const handleReassign = () => {
    const trimmed = reassignInput.trim();
    onReassign(trimmed !== '' ? trimmed : null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-slide-over-title"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="complaint-slide-over-title" className="font-semibold text-gray-800">
            Complaint {complaint.id.slice(0, 8)}
          </h2>
          <button
            aria-label="Close slide-over"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          {/* Description */}
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Description</h3>
            <p className="text-gray-800">{complaint.description}</p>
          </section>

          {/* Status */}
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Status</h3>
            {complaint.status === 'RESOLVED' ? (
              <p className="text-sm text-gray-700 font-medium">RESOLVED</p>
            ) : (
              <select
                aria-label="Status"
                value={complaint.status}
                onChange={(e) => onStatusChange(e.target.value as ComplaintStatus)}
                className="border rounded px-2 py-1 text-sm w-full"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </section>

          {/* Assignee */}
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Assignee</h3>
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Assignee admin ID"
                value={reassignInput}
                onChange={(e) => setReassignInput(e.target.value)}
                placeholder="admin ID"
                className="border rounded px-2 py-1 text-sm flex-1 font-mono"
              />
              <button
                onClick={handleReassign}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Reassign
              </button>
            </div>
            {complaint.assigneeAdminId && (
              <p className="text-xs text-gray-500 mt-1 font-mono">{complaint.assigneeAdminId}</p>
            )}
          </section>

          {/* Internal notes */}
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Internal Notes</h3>
            {complaint.internalNotes.length === 0 ? (
              <p className="text-gray-400 text-xs">No notes yet.</p>
            ) : (
              <ul className="space-y-2">
                {complaint.internalNotes.map((n, i) => (
                  <li key={i} className="bg-gray-50 rounded p-2">
                    <p className="text-gray-700">{n.note}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      {n.adminId} &middot; {formatDate(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Add note */}
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Add Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter internal note..."
              rows={3}
              className="border rounded px-2 py-1 text-sm w-full resize-none"
            />
            <button
              onClick={handleAddNote}
              className="btn btn-primary mt-1"
            >
              Add Note
            </button>
          </section>

          {/* Resolve */}
          {complaint.status !== 'RESOLVED' && (
            <section>
              <h3 className="text-xs text-gray-500 font-medium mb-1">Resolve Complaint</h3>
              <label htmlFor="resolution-category" className="sr-only">
                Resolution Category
              </label>
              <select
                id="resolution-category"
                aria-label="Resolution Category"
                value={resolutionCategory}
                onChange={(e) => setResolutionCategory(e.target.value as ComplaintResolutionCategory)}
                className="border rounded px-2 py-1 text-sm w-full mb-2"
              >
                {RESOLUTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button
                onClick={handleResolve}
                className="btn btn-success"
              >
                Resolve
              </button>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
