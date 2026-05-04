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
  fetchTechnicianCandidatesForOrder,
} from '@/api/orders';
import type { Order, TechnicianCandidate } from '@/types/order';

type Action = 'reassign' | 'complete' | 'refund' | 'waive-fee' | 'escalate' | 'note';

interface OverridePanelProps {
  order: Order;
  onActionComplete: (updatedOrder: Order) => void;
  onError: (message: string) => void;
  canOverride?: boolean | undefined;
  canFinancialOverride?: boolean | undefined;
}

export function OverridePanel({
  order,
  onActionComplete,
  onError,
  canOverride = true,
  canFinancialOverride = true,
}: OverridePanelProps) {
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [reassignTechId, setReassignTechId] = useState('');
  const [technicianCandidates, setTechnicianCandidates] = useState<TechnicianCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [escalatePriority, setEscalatePriority] = useState<'HIGH' | 'CRITICAL'>('HIGH');

  const close = () => setActiveAction(null);

  const openAction = (action: Action) => {
    setActiveAction(action);
    if (action !== 'reassign') return;

    setReassignTechId('');
    setCandidatesError(null);
    setCandidatesLoading(true);
    fetchTechnicianCandidatesForOrder(order.id)
      .then((candidates) => {
        setTechnicianCandidates(candidates);
        if (candidates.length === 1) setReassignTechId(candidates[0]!.technicianId);
      })
      .catch(() => {
        setTechnicianCandidates([]);
        setCandidatesError('Could not load technicians for this area.');
      })
      .finally(() => setCandidatesLoading(false));
  };

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
    extraInput?: {
      label: string;
      value: string;
      onChange: (v: string) => void;
      options?: Array<{ value: string; label: string }>;
      placeholder?: string;
      disabled?: boolean;
      helperText?: string;
    };
  }

  const actionConfigs: Record<Action, ActionConfig> = {
    reassign: {
      title: 'Re-assign Technician',
      extraInput: {
        label: 'Technician',
        value: reassignTechId,
        onChange: setReassignTechId,
        options: technicianCandidates.map((tech) => ({
          value: tech.technicianId,
          label: `${tech.displayName} (${tech.technicianId}) - ${tech.distanceKm.toFixed(1)} km`,
        })),
        placeholder: candidatesLoading ? 'Loading technicians...' : 'Select technician',
        disabled: candidatesLoading || technicianCandidates.length === 0,
        helperText: candidatesError ?? (
          technicianCandidates.length === 0 && !candidatesLoading
            ? 'No eligible technicians found for this service area.'
            : ''
        ),
      },
    },
    complete: { title: 'Mark Order Complete' },
    refund: { title: 'Issue Refund (stub)' },
    'waive-fee': { title: 'Waive Fee' },
    escalate: { title: `Escalate (${escalatePriority})` },
    note: { title: 'Add Internal Note', label: 'Note', minLen: 1 },
  };

  const buttons: Array<{ action: Action; label: string; financial?: boolean }> = [
    { action: 'reassign', label: 'Re-assign Tech' },
    { action: 'complete', label: 'Mark Complete' },
    { action: 'refund', label: 'Issue Refund', financial: true },
    { action: 'waive-fee', label: 'Waive Fee', financial: true },
    { action: 'escalate', label: 'Escalate' },
    { action: 'note', label: 'Add Note' },
  ];

  const visibleButtons = buttons.filter((button) => !button.financial || canFinancialOverride);

  return (
    <section aria-label="Order actions">
      <h3 className="text-xs text-gray-500 font-medium mb-2">Actions</h3>
      {!canOverride ? (
        <p className="text-xs text-gray-500">
          Your role can review this order but cannot run operational overrides.
        </p>
      ) : (
        <>
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
        {visibleButtons.map(({ action, label }) => (
          <button
            key={action}
            onClick={() => openAction(action)}
            className="border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            {label}
          </button>
        ))}
      </div>
        </>
      )}
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
