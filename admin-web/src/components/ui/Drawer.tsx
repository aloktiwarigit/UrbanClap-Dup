'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import FocusLock from 'react-focus-lock';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Only 'right' is supported today; kept explicit so a future left/bottom
   *  variant is an intentional signature change, not a silent default. */
  side?: 'right';
}

/**
 * Shared slide-over recipe extracted from OrderSlideOver / ComplaintSlideOver.
 * Same contract as Dialog (see Dialog.tsx) — role="dialog", focus trap,
 * topmost-only Escape, sibling backdrop — with a right-edge slide instead of
 * a centered card.
 *
 * New screens only — OrderSlideOver and ComplaintSlideOver keep their
 * hand-rolled implementations in this story (E21-S03).
 */
export function Drawer({ open, onClose, title, children, footer, side = 'right' }: DrawerProps) {
  void side; // only 'right' exists today; reserved for future variants
  const titleId = useId();
  const [entered, setEntered] = useState(false);

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
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
      <FocusLock returnFocus>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-lg transition-transform duration-[220ms] ease-out motion-reduce:transition-none motion-reduce:translate-x-0 ${
            entered ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-[var(--space-4)]">
            <h2 id={titleId} className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text)]">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-xl leading-none text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              &times;
            </button>
          </div>
          <div className="p-[var(--space-4)] text-[length:var(--text-sm)] text-[var(--color-text)]">{children}</div>
          {footer && (
            <div className="flex justify-end gap-[var(--space-3)] border-t border-[var(--color-border)] p-[var(--space-4)]">
              {footer}
            </div>
          )}
        </div>
      </FocusLock>
    </>
  );
}
