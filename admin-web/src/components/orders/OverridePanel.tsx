'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('orders');
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
        setCandidatesError(t('actions.reassign.fetchError'));
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
      onError(t('actions.error'));
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
      title: t('actions.reassign.title'),
      extraInput: {
        label: t('actions.reassign.selectLabel'),
        value: reassignTechId,
        onChange: setReassignTechId,
        options: technicianCandidates.map((tech) => ({
          value: tech.technicianId,
          label: `${tech.displayName} (${tech.technicianId}) - ${tech.distanceKm.toFixed(1)} km`,
        })),
        ...(candidatesLoading ? { placeholder: t('actions.reassign.loadingPlaceholder') } : {}),
        disabled: candidatesLoading || technicianCandidates.length === 0,
        helperText: candidatesError ?? (
          technicianCandidates.length === 0 && !candidatesLoading
            ? t('actions.reassign.noEligibleTechs')
            : ''
        ),
      },
    },
    complete: { title: t('actions.complete.title') },
    refund: { title: t('actions.refund.title') },
    'waive-fee': { title: t('actions.waiveFee.title') },
    escalate: { title: t('actions.escalate.title', { priority: escalatePriority }) },
    note: { title: t('actions.note.title'), label: t('actions.note.label'), minLen: 1 },
  };

  const buttons: Array<{ action: Action; label: string; financial?: boolean }> = [
    { action: 'reassign', label: t('actions.reassign.buttonLabel') },
    { action: 'complete', label: t('actions.complete.buttonLabel') },
    { action: 'refund', label: t('actions.refund.buttonLabel'), financial: true },
    { action: 'waive-fee', label: t('actions.waiveFee.buttonLabel'), financial: true },
    { action: 'escalate', label: t('actions.escalate.buttonLabel') },
    { action: 'note', label: t('actions.note.buttonLabel') },
  ];

  const visibleButtons = buttons.filter((button) => !button.financial || canFinancialOverride);

  return (
    <section aria-label={t('detail.sections.actions.heading')}>
      <h3 className="text-xs text-gray-500 font-medium mb-2">{t('detail.sections.actions.heading')}</h3>
      {!canOverride ? (
        <p className="text-xs text-gray-500">
          {t('detail.sections.actions.noPermission')}
        </p>
      ) : (
        <>
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
        <label htmlFor="escalate-priority">{t('actions.escalate.priorityLabel')}</label>
        <select
          id="escalate-priority"
          value={escalatePriority}
          onChange={e => setEscalatePriority(e.target.value as 'HIGH' | 'CRITICAL')}
          className="border border-gray-300 rounded px-1 py-0.5 text-xs"
        >
          <option value="HIGH">{t('actions.escalate.priorities.HIGH')}</option>
          <option value="CRITICAL">{t('actions.escalate.priorities.CRITICAL')}</option>
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
