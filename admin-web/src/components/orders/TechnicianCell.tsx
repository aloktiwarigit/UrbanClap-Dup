'use client';

import { useTranslations } from 'next-intl';

interface TechnicianCellProps {
  name?: string | undefined;
  id?: string | undefined;
}

export function TechnicianCell({ name, id }: TechnicianCellProps) {
  const t = useTranslations('orders.cells.technician');

  if (!id) {
    return (
      <span className="italic text-[var(--color-text-muted)]">
        {t('unassigned')}
      </span>
    );
  }

  const shortId = id.slice(0, 12);
  return (
    <div className="flex flex-col">
      {name && <span className="text-[var(--color-text)]">{name}</span>}
      <span className="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">
        {shortId}
      </span>
    </div>
  );
}
