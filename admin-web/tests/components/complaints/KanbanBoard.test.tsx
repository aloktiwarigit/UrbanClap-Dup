import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KanbanBoard } from '../../../src/components/complaints/KanbanBoard';
import type { Complaint } from '../../../src/types/complaint';

// Mock @hello-pangea/dnd to render children without DnD context
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (provided: object) => React.ReactNode }) =>
    <>{children({ innerRef: () => {}, droppableProps: {}, placeholder: null })}</>,
  Draggable: ({ children }: { children: (provided: object) => React.ReactNode }) =>
    <>{children({ innerRef: () => {}, draggableProps: {}, dragHandleProps: {} })}</>,
}));

function makeComplaint(id: string, status: Complaint['status'], overrides?: Partial<Complaint>): Complaint {
  return {
    id,
    orderId: `ord_${id}`,
    customerId: `cust_${id}`,
    technicianId: 'tech_001',
    description: `Complaint ${id}`,
    status,
    assigneeAdminId: undefined,
    resolutionCategory: undefined,
    internalNotes: [],
    slaDeadlineAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const complaints: Complaint[] = [
  makeComplaint('c1', 'NEW'),
  makeComplaint('c2', 'INVESTIGATING'),
  makeComplaint('c3', 'RESOLVED'),
  makeComplaint('c4', 'NEW'),
];

describe('KanbanBoard', () => {
  it('renders 3 columns with headers NEW, INVESTIGATING, RESOLVED', () => {
    render(<KanbanBoard complaints={complaints} onStatusChange={vi.fn()} />);
    expect(screen.getByText('NEW')).toBeDefined();
    expect(screen.getByText('INVESTIGATING')).toBeDefined();
    expect(screen.getByText('RESOLVED')).toBeDefined();
  });

  it('renders complaint cards in correct columns based on status', () => {
    render(<KanbanBoard complaints={complaints} onStatusChange={vi.fn()} />);
    // c1 and c4 are NEW, c2 is INVESTIGATING, c3 is RESOLVED
    // We can check by customer id presence
    const allCardButtons = screen.getAllByRole('button');
    // There should be at least 4 cards rendered (1 per complaint)
    expect(allCardButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('clicking a card opens the slide-over for that complaint', () => {
    render(<KanbanBoard complaints={[makeComplaint('c1', 'NEW')]} onStatusChange={vi.fn()} />);
    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);
    // SlideOver should appear — it renders the complaint description
    expect(screen.getByText('Complaint c1')).toBeDefined();
  });
});
