'use client';

import { useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { endOfIstDayUtcIso } from '@/lib/commissions/derive';

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
  const [untilTouched, setUntilTouched] = useState(false);

  const reasonError = reasonTouched && reason.trim() === '' ? t('detail.override.reasonRequired') : undefined;
  const untilError = untilTouched && until === '' ? t('detail.override.untilRequired') : undefined;

  // Codex round 3 (P2): a successful save closes this dialog from the *parent* — flipping `open` to
  // false without ever calling `handleClose` — while this component itself stays mounted (`Dialog`
  // unmounts only its own rendered output when `open` is false, not the parent `HoldOverrideDialog`
  // holding this state). `handleClose`'s reset alone therefore only covered the Cancel/backdrop/
  // Escape paths; a reopen after an external close kept showing the previous date, reason and
  // touched-validation state, submittable by accident. Reset on the `open` transition itself instead
  // — the same pattern `RemittanceDrawer`'s own open effect uses — so every reopen starts clean
  // regardless of how the previous close happened.
  useEffect(() => {
    if (!open) return;
    setUntil('');
    setReason('');
    setReasonTouched(false);
    setUntilTouched(false);
  }, [open]);

  function handleClose() {
    setUntil('');
    setReason('');
    setReasonTouched(false);
    setUntilTouched(false);
    onClose();
  }

  function handleSubmit() {
    setReasonTouched(true);
    setUntilTouched(true);
    if (reason.trim() === '' || until === '') {
      return;
    }
    // The API validates `until` as `z.string().datetime()` (a full ISO 8601 UTC instant) — the
    // raw `<input type="date">` value ("2026-09-30") fails that check. Convert to end-of-day IST
    // expressed in UTC so an override "until 30 September" covers all of that day in Ayodhya.
    onSubmit({ until: endOfIstDayUtcIso(until), reason: reason.trim() });
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
            onBlur={() => setUntilTouched(true)}
            className="px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]"
          />
        </label>
        {untilError !== undefined && (
          <p role="alert" className="text-xs text-[var(--color-danger)]">
            {untilError}
          </p>
        )}
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
