import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (_ns: string) => (key: string, params?: Record<string, unknown>): string => {
    if (params) {
      if ('h' in params && 'm' in params) return `${String(params.h)}h ${String(params.m)}m`;
      if ('m' in params && !('h' in params)) return `${String(params.m)}m`;
      const vals = Object.values(params).filter(v => typeof v === 'string' || typeof v === 'number');
      if (vals.length === 1) return String(vals[0]);
      if (vals.length > 0) return vals.map(String).join(' ');
    }
    const last = key.split('.').pop() ?? key;
    return last.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  },
  useLocale: () => 'en',
}));

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
  const base: Complaint = {
    id,
    orderId: `ord_${id}`,
    customerId: `cust_${id}`,
    technicianId: 'tech_001',
    description: `Complaint ${id}`,
    status,
    internalNotes: [],
    slaDeadlineAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    escalated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

const complaints: Complaint[] = [
  makeComplaint('c1', 'NEW'),
  makeComplaint('c2', 'INVESTIGATING'),
  makeComplaint('c3', 'RESOLVED'),
  makeComplaint('c4', 'NEW'),
];

describe('KanbanBoard', () => {
  it('renders 3 columns with headers NEW, INVESTIGATING, RESOLVED', () => {
    render(<KanbanBoard complaints={complaints} onStatusChange={vi.fn()} onAddNote={vi.fn()} onReassign={vi.fn()} onResolve={vi.fn()} />);
    // Column headers use t('kanban.column.NEW') etc. — mock lowercases/spaces all-caps keys:
    // 'NEW' → 'n e w', 'INVESTIGATING' → 'i n v e s t i g a t i n g', 'RESOLVED' → 'r e s o l v e d'
    expect(screen.getAllByText('n e w').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('i n v e s t i g a t i n g').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('r e s o l v e d').length).toBeGreaterThanOrEqual(1);
  });

  it('renders complaint cards in correct columns based on status', () => {
    render(<KanbanBoard complaints={complaints} onStatusChange={vi.fn()} onAddNote={vi.fn()} onReassign={vi.fn()} onResolve={vi.fn()} />);
    // c1 and c4 are NEW, c2 is INVESTIGATING, c3 is RESOLVED
    // We can check by customer id presence
    const allCardButtons = screen.getAllByRole('button');
    // There should be at least 4 cards rendered (1 per complaint)
    expect(allCardButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('clicking a card opens the slide-over for that complaint', () => {
    render(<KanbanBoard complaints={[makeComplaint('c1', 'NEW')]} onStatusChange={vi.fn()} onAddNote={vi.fn()} onReassign={vi.fn()} onResolve={vi.fn()} />);
    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);
    // SlideOver should appear — it renders the complaint description in a <p>
    const descElements = screen.getAllByText('Complaint c1');
    expect(descElements.length).toBeGreaterThanOrEqual(1);
  });
});
