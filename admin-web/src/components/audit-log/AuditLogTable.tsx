'use client';

import { Fragment, useState } from 'react';
import type { AuditLogEntry } from '@/types/audit-log';

interface Props {
  entries: AuditLogEntry[];
}

export function AuditLogTable({ entries }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (entries.length === 0) {
    return (
      <p className="py-[var(--space-4)] text-sm text-[var(--color-text-muted)]">
        No entries found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[var(--color-border)]">
      <table className="w-full text-sm text-left text-[var(--color-text)]">
        <thead className="bg-[var(--color-surface-alt)]">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Timestamp</th>
            <th scope="col" className="px-3 py-2 font-medium">Admin ID</th>
            <th scope="col" className="px-3 py-2 font-medium">Action</th>
            <th scope="col" className="px-3 py-2 font-medium">Resource Type</th>
            <th scope="col" className="px-3 py-2 font-medium">Resource ID</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <Fragment key={entry.id}>
              <tr
                onClick={() => toggle(entry.id)}
                className="border-t border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-surface-alt)]"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="px-3 py-2">{entry.adminId}</td>
                <td className="px-3 py-2 font-mono">{entry.action}</td>
                <td className="px-3 py-2">{entry.resourceType}</td>
                <td className="px-3 py-2 font-mono text-xs">{entry.resourceId}</td>
              </tr>
              {expandedId === entry.id && (
                <tr className="bg-[var(--color-surface-alt)]">
                  <td colSpan={5} className="px-3 py-3">
                    <pre className="text-xs overflow-auto max-h-48 rounded bg-[var(--color-surface)] p-2 border border-[var(--color-border)]">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
