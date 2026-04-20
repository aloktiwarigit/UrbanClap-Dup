'use client';

import type { AuditLogFiltersState } from '@/types/audit-log';
import { EMPTY_FILTERS } from '@/types/audit-log';

interface Props {
  filters: AuditLogFiltersState;
  onChange: (updated: AuditLogFiltersState) => void;
}

function FilterInput({
  label,
  htmlFor,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  htmlFor: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex flex-col gap-1 text-xs text-[var(--color-text-muted)]"
    >
      {label}
      <input
        id={htmlFor}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-xs"
      />
    </label>
  );
}

export function AuditLogFilters({ filters, onChange }: Props) {
  function update(partial: Partial<AuditLogFiltersState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap gap-[var(--space-3)] items-end mb-[var(--space-4)]">
      <FilterInput
        label="Admin ID"
        htmlFor="filter-adminId"
        value={filters.adminId}
        onChange={(v) => update({ adminId: v })}
      />
      <FilterInput
        label="Action"
        htmlFor="filter-action"
        value={filters.action}
        onChange={(v) => update({ action: v })}
      />
      <FilterInput
        label="Resource Type"
        htmlFor="filter-resourceType"
        value={filters.resourceType}
        onChange={(v) => update({ resourceType: v })}
      />
      <FilterInput
        label="Resource ID"
        htmlFor="filter-resourceId"
        value={filters.resourceId}
        onChange={(v) => update({ resourceId: v })}
      />
      <FilterInput
        label="From"
        htmlFor="filter-dateFrom"
        value={filters.dateFrom}
        onChange={(v) => update({ dateFrom: v })}
        type="datetime-local"
      />
      <FilterInput
        label="To"
        htmlFor="filter-dateTo"
        value={filters.dateTo}
        onChange={(v) => update({ dateTo: v })}
        type="datetime-local"
      />
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="px-3 py-1 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
      >
        Clear
      </button>
    </div>
  );
}
