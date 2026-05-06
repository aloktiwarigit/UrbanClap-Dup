'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/lib/auth/context';
import { patchTechnicianClient } from '@/api/technicians';
import type { AdminTechnician, TechnicianStatus } from '@/types/technician-admin';

interface Props {
  initialTechnicians: AdminTechnician[];
}

type StatusFilter = 'ALL' | TechnicianStatus;

const STATUS_COLORS: Record<TechnicianStatus, string> = {
  ON_DUTY:   'var(--teal)',
  OFF_DUTY:  'var(--fog-0)',
  SUSPENDED: 'var(--rose)',
};

const KYC_COLORS: Record<string, string> = {
  VERIFIED: 'var(--teal)',
  PENDING:  'var(--ember)',
  REJECTED: 'var(--rose)',
};

export function TechnicianRosterClient({ initialTechnicians }: Props) {
  const t = useTranslations('technicians');
  const { auth } = useAdminAuth();
  const isSuperAdmin = auth?.role === 'super-admin';

  const [technicians, setTechnicians] = useState(initialTechnicians);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionDraft, setCommissionDraft] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesSearch =
        !search ||
        tech.name.toLowerCase().includes(search.toLowerCase()) ||
        tech.phone.includes(search);
      const matchesStatus = statusFilter === 'ALL' || tech.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [technicians, search, statusFilter]);

  async function handleStatusChange(id: string, newStatus: TechnicianStatus) {
    setLoading(id);
    try {
      await patchTechnicianClient(id, { status: newStatus });
      setTechnicians((prev) =>
        prev.map((tech) => (tech.id === id ? { ...tech, status: newStatus } : tech)),
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleCommissionSave(id: string) {
    const pct = parseInt(commissionDraft, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    setLoading(id);
    try {
      await patchTechnicianClient(id, { commissionPct: pct });
      setTechnicians((prev) =>
        prev.map((tech) => (tech.id === id ? { ...tech, commissionPct: pct } : tech)),
      );
    } finally {
      setLoading(null);
      setEditingCommission(null);
    }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--fog-3)' }}>
          {t('title')}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-4)', background: 'var(--ink-2)', color: 'var(--fog-2)', fontSize: '0.8125rem', minWidth: '220px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--ink-4)', background: 'var(--ink-2)', color: 'var(--fog-2)', fontSize: '0.8125rem' }}
          >
            <option value="ALL">{t('filterAll')}</option>
            <option value="ON_DUTY">{t('status.ON_DUTY')}</option>
            <option value="OFF_DUTY">{t('status.OFF_DUTY')}</option>
            <option value="SUSPENDED">{t('status.SUSPENDED')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--fog-0)', textAlign: 'center', padding: '3rem 0' }}>No technicians found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ink-4)', color: 'var(--fog-0)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>{t('columns.name')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.phone')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.categories')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.status')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.kyc')}</th>
                {isSuperAdmin && <th style={{ padding: '8px 12px' }}>{t('columns.commission')}</th>}
                <th style={{ padding: '8px 12px' }}>{t('columns.activeJobs')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tech) => (
                <tr key={tech.id} style={{ borderBottom: '1px solid var(--ink-3)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--fog-3)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--teal-dim)', color: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                        {tech.name.slice(0, 2).toUpperCase()}
                      </div>
                      {tech.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--fog-1)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{tech.phone}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tech.serviceCategories.map((cat) => (
                        <span key={cat} style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--ink-3)', color: 'var(--fog-1)', fontSize: '0.7rem' }}>{cat}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: `color-mix(in srgb, ${STATUS_COLORS[tech.status]} 15%, transparent)`, color: STATUS_COLORS[tech.status], fontSize: '0.75rem', fontWeight: 600 }}>
                      {t(`status.${tech.status}` as 'status.ON_DUTY')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: `color-mix(in srgb, ${KYC_COLORS[tech.kycStatus] ?? 'var(--fog-0)'} 15%, transparent)`, color: KYC_COLORS[tech.kycStatus] ?? 'var(--fog-0)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {t(`kyc.${tech.kycStatus}` as 'kyc.VERIFIED')}
                      </span>
                      {tech.kycStatus === 'VERIFIED' && tech.kycDocumentUrl && (
                        <a href={tech.kycDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--marigold)', fontSize: '0.7rem' }}>{t('actions.viewKyc')}</a>
                      )}
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td style={{ padding: '10px 12px' }}>
                      {editingCommission === tech.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="number" value={commissionDraft} onChange={(e) => setCommissionDraft(e.target.value)} min={0} max={100}
                            style={{ width: 52, padding: '3px 6px', background: 'var(--ink-2)', border: '1px solid var(--ink-4)', color: 'var(--fog-2)', borderRadius: 3, fontSize: '0.8rem' }} />
                          <button onClick={() => void handleCommissionSave(tech.id)} disabled={loading === tech.id}
                            style={{ padding: '3px 8px', background: 'var(--teal)', color: 'var(--ink-0)', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>&#x2713;</button>
                          <button onClick={() => setEditingCommission(null)}
                            style={{ padding: '3px 6px', background: 'transparent', color: 'var(--fog-0)', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>&#x2715;</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingCommission(tech.id); setCommissionDraft(String(tech.commissionPct)); }}
                          style={{ background: 'transparent', border: '1px solid var(--ink-4)', padding: '3px 8px', borderRadius: 3, color: 'var(--fog-2)', cursor: 'pointer', fontSize: '0.8rem' }}>
                          {tech.commissionPct}%
                        </button>
                      )}
                    </td>
                  )}
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: tech.activeBookingCount > 0 ? 'var(--teal-soft)' : 'var(--fog-0)' }}>
                    {tech.activeBookingCount}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {tech.status !== 'ON_DUTY' && tech.status !== 'SUSPENDED' && (
                        <button onClick={() => void handleStatusChange(tech.id, 'ON_DUTY')} disabled={loading === tech.id}
                          style={{ padding: '4px 8px', background: 'var(--teal-dim)', color: 'var(--teal-soft)', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                          {t('actions.goOnDuty')}
                        </button>
                      )}
                      {tech.status === 'ON_DUTY' && (
                        <button onClick={() => void handleStatusChange(tech.id, 'OFF_DUTY')} disabled={loading === tech.id}
                          style={{ padding: '4px 8px', background: 'var(--ink-3)', color: 'var(--fog-1)', border: '1px solid var(--ink-4)', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                          {t('actions.goOffDuty')}
                        </button>
                      )}
                      {tech.status !== 'SUSPENDED' && (
                        <button onClick={() => void handleStatusChange(tech.id, 'SUSPENDED')} disabled={loading === tech.id}
                          style={{ padding: '4px 8px', background: 'color-mix(in srgb, var(--rose) 15%, transparent)', color: 'var(--rose)', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                          {t('actions.suspend')}
                        </button>
                      )}
                      {tech.status === 'SUSPENDED' && (
                        <button onClick={() => void handleStatusChange(tech.id, 'OFF_DUTY')} disabled={loading === tech.id}
                          style={{ padding: '4px 8px', background: 'var(--ink-3)', color: 'var(--fog-1)', border: '1px solid var(--ink-4)', borderRadius: 3, cursor: 'pointer', fontSize: '0.75rem' }}>
                          {t('actions.reactivate')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
