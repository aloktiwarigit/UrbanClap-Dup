'use client';

import { useTranslations } from 'next-intl';
import { ContactReveal } from './ContactReveal';

interface CustomerCellProps {
  orderId: string;
  name: string;
  phone: string;
  canReveal: boolean;
}

export function CustomerCell({ orderId, name, phone, canReveal }: CustomerCellProps) {
  const t = useTranslations('orders.cells.customer');
  const trimmed = name.trim();
  const hasName = trimmed.length > 0;

  return (
    <div className="flex flex-col">
      <span
        className={
          hasName ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] italic'
        }
      >
        {hasName ? trimmed : t('noName')}
      </span>
      <ContactReveal
        orderId={orderId}
        party="CUSTOMER"
        maskedPhone={phone || undefined}
        canReveal={canReveal}
        variant="inline"
      />
    </div>
  );
}
