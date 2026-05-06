'use client';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatINR, formatDateTime } from '@/lib/format/intl';
import type { Order } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { OverridePanel } from './OverridePanel';
import { TrustDossierPanel } from '@/components/technicians/TrustDossierPanel';

interface OrderSlideOverProps {
  order: Order;
  onClose: () => void;
  onOrderUpdated?: (updated: Order) => void;
  canOverride?: boolean | undefined;
  canFinancialOverride?: boolean | undefined;
}

type Toast = { message: string; type: 'success' | 'error' };

export function OrderSlideOver({
  order,
  onClose,
  onOrderUpdated,
  canOverride,
  canFinancialOverride,
}: OrderSlideOverProps) {
  const t = useTranslations('orders');
  const locale = useLocale();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [toast, setToast] = useState<Toast | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">{t('detail.title', { orderId: currentOrder.id.slice(0, 8) })}</h2>
          <button aria-label={t('detail.closeButton.ariaLabel')} onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.status')}</h3><StatusBadge status={currentOrder.status} /></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.customer')}</h3><p>{currentOrder.customerName}</p><p className="text-gray-500">{currentOrder.customerPhone}</p></section>
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.technician')}</h3>
            <p>{currentOrder.technicianName ?? '—'}</p>
            <p className="text-gray-500 font-mono text-xs">{currentOrder.technicianId ?? '—'}</p>
            <TrustDossierPanel technicianId={currentOrder.technicianId} />
          </section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.service')}</h3><p>{currentOrder.serviceName ?? '—'}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.location')}</h3><p>{currentOrder.city}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.scheduled')}</h3><p>{formatDateTime(currentOrder.scheduledAt, locale)}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.payment')}</h3><p className="text-lg font-semibold">{formatINR(currentOrder.amount, locale)}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">{t('detail.sections.created')}</h3><p>{formatDateTime(currentOrder.createdAt, locale)}</p></section>

          {toast && (
            <p role="status" className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {toast.message}
            </p>
          )}

          <OverridePanel
            order={currentOrder}
            canOverride={canOverride}
            canFinancialOverride={canFinancialOverride}
            onActionComplete={updated => {
              setCurrentOrder(updated);
              setToast({ message: t('detail.toast.success'), type: 'success' });
              onOrderUpdated?.(updated);
            }}
            onError={message => setToast({ message, type: 'error' })}
          />
        </div>
      </div>
    </>
  );
}
