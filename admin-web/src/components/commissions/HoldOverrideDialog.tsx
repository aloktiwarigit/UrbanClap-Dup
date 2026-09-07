'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';

export interface HoldOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: { until: string; reason: string }) => void;
  submitting?: boolean;
}

/**
 * The "set hold override" dialog (task-7 brief, Task 4's shared `Dialog` recipe). Takes `until`
 * (a date input) and `reason` (required, non-empty) — an override always names *why*, because in
 * a dispute the owner needs to explain the override to the technician on the same call that
 * prompted it. Visibility of the trigger that opens this dialog is gated on `settings.manage` by
 * the caller (`TechnicianLedgerClient`); this component itself has no capability awareness.
 */
export function HoldOverrideDialog({ open, onClose, onSubmit, submitting = false }: HoldOverrideDialogProps) {
  const t = useTranslations('commissions');
  const untilId = useId();
  const reasonId = useId();
  const [until, setUntil] = useState('');
  const [reason, setReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);

  const reasonError = reasonTouched && reason.trim() === '' ? t('detail.override.reasonRequired') : undefined;

  function handleClose() {
    setUntil('');
    setReason('');
    setReasonTouched(false);
    onClose();
  }

  function handleSubmit() {
    setReasonTouched(true);
    if (reason.trim() === '') {
      return;
    }
    onSubmit({ until, reason: reason.trim() });
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('detail.override.dialogTitle')}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded border border-[var(--color-border)] text-sm text-[var(--color-text)]"
          >
            {t('detail.override.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-sm font-medium disabled:opacity-40"
          >
            {t('detail.override.save')}
          </button>
        </>
      }
    >
      <div className="space-y-[var(--space-3)]">
        <label htmlFor={untilId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('detail.override.untilLabel')}
          <input
            id={untilId}
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]"
          />
        </label>
        <label htmlFor={reasonId} className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]">
          {t('detail.override.reasonLabel')}
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setReasonTouched(true)}
            rows={3}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] resize-none"
          />
        </label>
        {reasonError !== undefined && (
          <p role="alert" className="text-xs text-[var(--color-danger)]">
            {reasonError}
          </p>
        )}
      </div>
    </Dialog>
  );
}
