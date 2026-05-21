'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useState } from 'react';
import FocusLock from 'react-focus-lock';
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

const PHOTO_STAGE_LABELS: Record<string, string> = {
  EN_ROUTE: 'Start trip',
  REACHED: 'Arrived',
  IN_PROGRESS: 'Work started',
  COMPLETED: 'Completed',
};

function photoStageLabel(stage: string): string {
  return PHOTO_STAGE_LABELS[stage] ?? stage.replaceAll('_', ' ');
}

export function OrderSlideOver({
  order,
  onClose,
  onOrderUpdated,
  canOverride,
  canFinancialOverride,
}: OrderSlideOverProps) {
  const t = useTranslations('orders');
  const locale = useLocale();
  const titleId = useId();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <FocusLock returnFocus>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id={titleId} className="font-semibold text-gray-800">{t('detail.title', { orderId: currentOrder.id.slice(0, 8) })}</h2>
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
          {currentOrder.jobPhotoSets && currentOrder.jobPhotoSets.length > 0 && (
            <section>
              <h3 className="text-xs text-gray-500 font-medium mb-2">{t('detail.sections.evidencePhotos')}</h3>
              <div className="space-y-3">
                {currentOrder.jobPhotoSets.map(photoSet => (
                  <div key={photoSet.stage}>
                    <p className="mb-2 text-xs font-medium text-gray-700">{photoStageLabel(photoSet.stage)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {photoSet.urls.map((url, index) => (
                        <a
                          key={`${photoSet.stage}-${url}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded border border-gray-200 bg-gray-50"
                        >
                          <img
                            src={url}
                            alt={`${photoStageLabel(photoSet.stage)} evidence ${index + 1}`}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
      </FocusLock>
    </>
  );
}
