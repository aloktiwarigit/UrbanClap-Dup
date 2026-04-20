import type { Metadata } from 'next';
import { AuditLogClient } from '@/components/audit-log/AuditLogClient';

export const metadata: Metadata = {
  title: 'Audit Log — homeservices admin',
};

export default function AuditLogPage() {
  return (
    <div className="p-[var(--space-6)]">
      <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
        Audit Log
      </h1>
      <AuditLogClient />
    </div>
  );
}
