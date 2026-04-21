'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Complaint, ComplaintStatus, ComplaintResolutionCategory } from '@/types/complaint';
import { ComplaintCard } from './ComplaintCard';
import { ComplaintSlideOver } from './ComplaintSlideOver';

interface KanbanBoardProps {
  complaints: Complaint[];
  onStatusChange: (id: string, status: ComplaintStatus) => void;
  onAddNote: (id: string, note: string) => void;
  onReassign: (id: string, adminId: string) => void;
  onResolve: (id: string, resolutionCategory: ComplaintResolutionCategory) => void;
}

const COLUMNS: ComplaintStatus[] = ['NEW', 'INVESTIGATING', 'RESOLVED'];

export function KanbanBoard({ complaints, onStatusChange, onAddNote, onReassign, onResolve }: KanbanBoardProps) {
  // Store the ID only — derive the full object from props so slide-over always reflects current state.
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId) ?? null;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const targetStatus = result.destination.droppableId as ComplaintStatus;
    const sourceStatus = result.source.droppableId as ComplaintStatus;
    if (targetStatus === sourceStatus) return;
    // Resolved complaints are immutable — drag out is a no-op.
    if (sourceStatus === 'RESOLVED') return;
    // Dragging to RESOLVED requires a resolution category — open the slide-over resolve section.
    if (targetStatus === 'RESOLVED') {
      setSelectedComplaintId(result.draggableId);
      return;
    }
    onStatusChange(result.draggableId, targetStatus);
  };

  const handleStatusChange = (status: ComplaintStatus) => {
    if (!selectedComplaintId) return;
    onStatusChange(selectedComplaintId, status);
  };

  const handleAddNote = (note: string) => {
    if (!selectedComplaintId) return;
    onAddNote(selectedComplaintId, note);
  };

  const handleResolve = (category: ComplaintResolutionCategory) => {
    if (!selectedComplaintId) return;
    onResolve(selectedComplaintId, category);
  };

  const handleReassign = (adminId: string) => {
    if (!selectedComplaintId) return;
    onReassign(selectedComplaintId, adminId);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((columnStatus) => {
            const columnComplaints = complaints.filter((c) => c.status === columnStatus);
            return (
              <div key={columnStatus} className="flex-1 min-w-[260px]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-sm text-gray-700">{columnStatus}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {columnComplaints.length}
                  </span>
                </div>
                <Droppable droppableId={columnStatus}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[100px] bg-gray-50 rounded-lg p-2"
                    >
                      {columnComplaints.map((complaint, index) => (
                        <Draggable
                          key={complaint.id}
                          draggableId={complaint.id}
                          index={index}
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <ComplaintCard
                                complaint={complaint}
                                onClick={() => setSelectedComplaintId(complaint.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedComplaint && (
        <ComplaintSlideOver
          key={selectedComplaint.id}
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaintId(null)}
          onStatusChange={handleStatusChange}
          onAddNote={handleAddNote}
          onResolve={handleResolve}
          onReassign={handleReassign}
        />
      )}
    </>
  );
}
