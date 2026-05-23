'use client';

import { useTranslations } from 'next-intl';

interface CustomerCellProps {
  name: string;
  phone: string;
}

export function CustomerCell({ name, phone }: CustomerCellProps) {
  const t = useTranslations('orders.cells.customer');
  const trimmed = name.trim();
  const hasName = trimmed.length > 0;

  return (
    <div className="flex flex-col">
      <span
        className={
          hasName
            ? 'text-[var(--color-text)]'
            : 'text-[var(--color-text-muted)] italic'
        }
      >
        {hasName ? trimmed : t('noName')}
      </span>
      <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
        {phone}
      </span>
    </div>
  );
}
