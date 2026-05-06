import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuditLogClient } from '@/components/audit-log/AuditLogClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auditLog');
  return {
    title: t('metadata.title'),
  };
}

export default async function AuditLogPage() {
  const t = await getTranslations('auditLog');
  return (
    <div className="p-[var(--space-6)]">
      <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
        {t('title')}
      </h1>
      <AuditLogClient />
    </div>
  );
}
