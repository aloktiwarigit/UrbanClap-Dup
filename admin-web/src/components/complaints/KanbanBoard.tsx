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
}

const COLUMNS: ComplaintStatus[] = ['NEW', 'INVESTIGATING', 'RESOLVED'];

export function KanbanBoard({ complaints, onStatusChange, onAddNote, onReassign }: KanbanBoardProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const targetStatus = result.destination.droppableId as ComplaintStatus;
    const sourceStatus = result.source.droppableId as ComplaintStatus;
    if (targetStatus === sourceStatus) return;
    onStatusChange(result.draggableId, targetStatus);
  };

  const handleStatusChange = (status: ComplaintStatus) => {
    if (!selectedComplaint) return;
    onStatusChange(selectedComplaint.id, status);
    setSelectedComplaint((prev) => prev ? { ...prev, status } : null);
  };

  const handleAddNote = (note: string) => {
    if (!selectedComplaint) return;
    onAddNote(selectedComplaint.id, note);
  };

  const handleResolve = (category: ComplaintResolutionCategory) => {
    if (!selectedComplaint) return;
    onStatusChange(selectedComplaint.id, 'RESOLVED');
    setSelectedComplaint((prev) =>
      prev ? { ...prev, status: 'RESOLVED', resolutionCategory: category } : null,
    );
  };

  const handleReassign = (adminId: string) => {
    if (!selectedComplaint) return;
    onReassign(selectedComplaint.id, adminId);
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
                                onClick={() => setSelectedComplaint(complaint)}
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
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onStatusChange={handleStatusChange}
          onAddNote={handleAddNote}
          onResolve={handleResolve}
          onReassign={handleReassign}
        />
      )}
    </>
  );
}
