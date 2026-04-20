'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogFilters } from './AuditLogFilters';
import { EMPTY_FILTERS } from '@/types/audit-log';
import type { AuditLogListResponse, AuditLogFiltersState } from '@/types/audit-log';

export function AuditLogClient() {
  const [filters, setFilters] = useState<AuditLogFiltersState>(EMPTY_FILTERS);
  const [data, setData] = useState<AuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continuationStack, setContinuationStack] = useState<string[]>([]);

  const fetchPage = useCallback(
    async (continuationToken?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.adminId) params.set('adminId', filters.adminId);
        if (filters.action) params.set('action', filters.action);
        if (filters.resourceType) params.set('resourceType', filters.resourceType);
        if (filters.resourceId) params.set('resourceId', filters.resourceId);
        if (filters.dateFrom) params.set('dateFrom', new Date(filters.dateFrom).toISOString());
        if (filters.dateTo) params.set('dateTo', new Date(filters.dateTo).toISOString());
        if (continuationToken) params.set('continuationToken', continuationToken);

        const res = await fetch(`/api/v1/admin/audit-log?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          setError(`API error: ${res.status}`);
          return;
        }
        const json = (await res.json()) as AuditLogListResponse;
        setData(json);
      } catch {
        setError('Failed to load audit log. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    setContinuationStack([]);
    void fetchPage();
  }, [fetchPage]);

  function handleNextPage() {
    if (!data?.continuationToken) return;
    const token = data.continuationToken;
    setContinuationStack((prev) => [...prev, token]);
    void fetchPage(token);
  }

  function handlePrevPage() {
    const stack = [...continuationStack];
    stack.pop();
    setContinuationStack(stack);
    void fetchPage(stack[stack.length - 1]);
  }

  return (
    <div>
      <AuditLogFilters filters={filters} onChange={setFilters} />

      {loading && (
        <p className="text-sm text-[var(--color-text-muted)] mb-[var(--space-3)]">Loading…</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-[var(--color-danger)] mb-[var(--space-3)]">
          {error}
        </p>
      )}
      {!loading && data && <AuditLogTable entries={data.entries} />}

      <div className="flex gap-[var(--space-3)] mt-[var(--space-4)]">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={continuationStack.length === 0}
          className="px-3 py-1 text-sm rounded border border-[var(--color-border)] disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!data?.continuationToken}
          className="px-3 py-1 text-sm rounded border border-[var(--color-border)] disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
