'use client';
import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';
import {
  reassignOrder,
  completeOrder,
  refundOrder,
  waiveFeeOrder,
  escalateOrder,
  addOrderNote,
} from '@/api/orders';
import type { Order } from '@/types/order';

type Action = 'reassign' | 'complete' | 'refund' | 'waive-fee' | 'escalate' | 'note';

interface OverridePanelProps {
  order: Order;
  onActionComplete: (updatedOrder: Order) => void;
  onError: (message: string) => void;
}

export function OverridePanel({ order, onActionComplete, onError }: OverridePanelProps) {
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [reassignTechId, setReassignTechId] = useState('');
  const [escalatePriority, setEscalatePriority] = useState<'HIGH' | 'CRITICAL'>('HIGH');

  const close = () => setActiveAction(null);

  const run = async (apiCall: () => Promise<Order>) => {
    setLoading(true);
    try {
      const updated = await apiCall();
      onActionComplete(updated);
      close();
    } catch {
      onError('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (reason: string) => {
    switch (activeAction) {
      case 'reassign':
        return run(() => reassignOrder(order.id, { technicianId: reassignTechId, reason }));
      case 'complete':
        return run(() => completeOrder(order.id, { reason }));
      case 'refund':
        return run(() => refundOrder(order.id, { reason }));
      case 'waive-fee':
        return run(() => waiveFeeOrder(order.id, { reason }));
      case 'escalate':
        return run(() => escalateOrder(order.id, { reason, priority: escalatePriority }));
      case 'note':
        return run(() => addOrderNote(order.id, { note: reason }));
      default:
        break;
    }
  };

  interface ActionConfig {
    title: string;
    label?: string;
    minLen?: number;
    extraInput?: { label: string; value: string; onChange: (v: string) => void };
  }

  const actionConfigs: Record<Action, ActionConfig> = {
    reassign: {
      title: 'Re-assign Technician',
      extraInput: { label: 'New Technician ID', value: reassignTechId, onChange: setReassignTechId },
    },
    complete: { title: 'Mark Order Complete' },
    refund: { title: 'Issue Refund (stub)' },
    'waive-fee': { title: 'Waive Fee' },
    escalate: { title: `Escalate (${escalatePriority})` },
    note: { title: 'Add Internal Note', label: 'Note', minLen: 1 },
  };

  const buttons: Array<{ action: Action; label: string }> = [
    { action: 'reassign', label: 'Re-assign Tech' },
    { action: 'complete', label: 'Mark Complete' },
    { action: 'refund', label: 'Issue Refund' },
    { action: 'waive-fee', label: 'Waive Fee' },
    { action: 'escalate', label: 'Escalate' },
    { action: 'note', label: 'Add Note' },
  ];

  return (
    <section aria-label="Order actions">
      <h3 className="text-xs text-gray-500 font-medium mb-2">Actions</h3>
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
        <label htmlFor="escalate-priority">Escalate priority:</label>
        <select
          id="escalate-priority"
          value={escalatePriority}
          onChange={e => setEscalatePriority(e.target.value as 'HIGH' | 'CRITICAL')}
          className="border border-gray-300 rounded px-1 py-0.5 text-xs"
        >
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {buttons.map(({ action, label }) => (
          <button
            key={action}
            onClick={() => setActiveAction(action)}
            className="border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            {label}
          </button>
        ))}
      </div>
      {activeAction && (() => {
        const cfg = actionConfigs[activeAction];
        return (
          <ConfirmModal
            title={cfg.title}
            {...(cfg.label !== undefined ? { inputLabel: cfg.label } : {})}
            {...(cfg.minLen !== undefined ? { inputMinLength: cfg.minLen } : {})}
            {...(cfg.extraInput !== undefined ? { extraInput: cfg.extraInput } : {})}
            onCancel={close}
            onConfirm={handleConfirm}
            loading={loading}
          />
        );
      })()}
    </section>
  );
}
