'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import type { components } from '@/api/generated/schema';
import { formatINR } from '@/lib/format/intl';
import { toggleServiceAction } from '../actions';

type AdminService = components['schemas']['AdminService'];

interface ServiceListProps {
  categoryId: string;
  services: AdminService[];
}

export function ServiceList({ categoryId, services: initialServices }: ServiceListProps) {
  const t = useTranslations('catalogue');
  const locale = useLocale();
  const [services, setServices] = useState(initialServices);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(service: AdminService) {
    setError(null);
    setPendingId(service.id);
    startTransition(async () => {
      const updated = await toggleServiceAction(service.id);
      setPendingId(null);
      if (!updated) {
        setError(t('serviceList.toggleError', { action: service.isActive ? 'unpublish' : 'publish', name: service.name }));
        return;
      }
      setServices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    });
  }

  if (services.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('serviceList.empty')}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {error !== null && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}
      {services.map((service) => {
        const isPending = pendingId === service.id;
        return (
          <div
            key={service.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>{service.name}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                {formatINR(service.basePrice, locale)} -{' '}
                <span style={{ color: service.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {service.isActive ? t('serviceList.statusPublished') : t('serviceList.statusUnpublished')}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => handleToggle(service)}
                disabled={isPending}
              >
                {isPending ? t('serviceList.updatingButton') : service.isActive ? t('serviceList.unpublishButton') : t('serviceList.publishButton')}
              </button>
              <Link
                href={`/catalogue/${categoryId}/services/${service.id}`}
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-brand)',
                  textDecoration: 'underline',
                }}
              >
                {t('serviceList.editLink')}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
