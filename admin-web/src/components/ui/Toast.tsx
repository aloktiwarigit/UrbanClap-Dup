'use client';

import { useCallback, useEffect, useState } from 'react';

export type ToastTone = 'success' | 'error';

export interface ToastState {
  message: string;
  tone: ToastTone;
}

export interface ToastRegionProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

/**
 * Renders the current toast, if any. A success toast is role="status"
 * (implicit aria-live="polite") so it does not interrupt a screen reader
 * mid-sentence; an error toast is role="alert" (implicit
 * aria-live="assertive") so it does interrupt — these are different roles
 * for a real reason and must not be collapsed into one.
 */
export function ToastRegion({ toast, onDismiss }: ToastRegionProps) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`fixed bottom-[var(--space-6)] right-[var(--space-6)] z-[70] flex max-w-sm items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border p-[var(--space-4)] shadow-lg transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
        isError
          ? 'border-[var(--color-danger)] bg-[var(--color-surface-raised)] text-[var(--color-danger)]'
          : 'border-[var(--color-success)] bg-[var(--color-surface-raised)] text-[var(--color-success)]'
      }`}
    >
      <p className="text-[length:var(--text-sm)]">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-auto text-[length:var(--text-sm)] leading-none text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        &times;
      </button>
    </div>
  );
}

export interface UseToastResult {
  toast: ToastState | null;
  show: (message: string, tone: ToastTone) => void;
  dismiss: () => void;
}

/** Owns toast state for a screen. Pair with <ToastRegion> to render it. */
export function useToast(): UseToastResult {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone });
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, show, dismiss };
}
