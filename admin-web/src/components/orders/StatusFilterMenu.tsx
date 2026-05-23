'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatusFilterMenuProps {
  statuses: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
}

export function StatusFilterMenu({ statuses, selected, onChange }: StatusFilterMenuProps) {
  const t = useTranslations('orders.filters.status');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([...selected]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  // Sync draft when parent's `selected` changes between opens
  useEffect(() => {
    if (!open) setDraft([...selected]);
  }, [open, selected]);

  // Click-outside dismiss
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const triggerLabel =
    selected.length === 0
      ? t('buttonNoneSelected')
      : selected.length === statuses.length
        ? t('buttonAllSelected')
        : t('buttonNSelected', { count: selected.length });

  function toggleDraft(status: string) {
    setDraft((curr) =>
      curr.includes(status) ? curr.filter((s) => s !== status) : [...curr, status],
    );
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clearAll() {
    setDraft([]);
    onChange([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
      >
        <Filter size={14} aria-hidden="true" />
        <span>{triggerLabel}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="dialog"
          aria-label={t('menuLabel')}
          className="absolute z-30 mt-1 min-w-[14rem] rounded border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-lg"
        >
          <ul className="max-h-64 overflow-y-auto p-2">
            {statuses.map((status) => {
              const checked = draft.includes(status);
              return (
                <li key={status}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                    <input
                      type="checkbox"
                      aria-label={status}
                      checked={checked}
                      onChange={() => toggleDraft(status)}
                      className="h-4 w-4 accent-[var(--marigold)]"
                    />
                    <span className="font-mono text-xs">{status}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-2 py-1.5">
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {t('clearButton')}
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded bg-[var(--marigold)] px-3 py-1 text-xs font-medium text-[var(--ink-0)] hover:opacity-90"
            >
              {t('applyButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
