'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import FocusLock from 'react-focus-lock';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Override the generated id used for aria-labelledby (rarely needed). */
  titleId?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared modal-dialog recipe extracted from ConfirmModal / ApproveAllModal.
 *
 * Contract (mirrored by tests/a11y/finance.a11y.spec.ts against the real
 * browser — do not change without checking that spec):
 *  - <FocusLock returnFocus> traps focus and restores it to the trigger.
 *  - role="dialog" aria-modal="true" aria-labelledby={id}.
 *  - Escape closes via a manual keydown listener, but only when THIS
 *    dialog's own DOM node is the topmost (last) [role="dialog"] in the
 *    document — identity, not count. A nested dialog (e.g. a ConfirmModal
 *    opened from within this one) is the last node and closes; every
 *    dialog underneath it is not the last node and stays open.
 *  - The backdrop is a plain sibling <div aria-hidden="true"> that closes
 *    on click.
 *
 * New screens only — ConfirmModal, OrderSlideOver, ApproveAllModal and
 * ComplaintSlideOver keep their hand-rolled implementations (E21-S03).
 */
export function Dialog({ open, onClose, titleId, title, children, footer }: DialogProps) {
  const generatedId = useId();
  const resolvedTitleId = titleId ?? generatedId;
  const [entered, setEntered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setEntered(true);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Only the topmost (last in DOM order) [role="dialog"] reacts — by
      // identity, not by count, so a dialog nested inside this one still
      // closes on its own Escape press while this one stays open.
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;
      onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <FocusLock returnFocus>
        {/*
          This wrapper spans the full viewport only so the card below can be
          centered with flexbox. It is deliberately pointer-events-none so a
          click anywhere outside the card falls through to the backdrop
          sibling above (which closes the dialog) instead of being swallowed
          by an invisible full-screen hit target.
        */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={resolvedTitleId}
          className="pointer-events-none fixed inset-0 z-[51] flex items-center justify-center p-[var(--space-4)]"
        >
          <div
            className={`pointer-events-auto w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-[var(--space-6)] shadow-lg transition-[opacity,transform] duration-[220ms] ease-out motion-reduce:transition-none motion-reduce:transform-none ${
              entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            }`}
          >
            <h2
              id={resolvedTitleId}
              className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)] mb-[var(--space-3)]"
            >
              {title}
            </h2>
            <div className="text-[length:var(--text-sm)] text-[var(--color-text)]">{children}</div>
            {footer && <div className="mt-[var(--space-6)] flex justify-end gap-[var(--space-3)]">{footer}</div>}
          </div>
        </div>
      </FocusLock>
    </>
  );
}
