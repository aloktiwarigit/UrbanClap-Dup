'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  patchCustomerClient,
  addCustomerNoteClient,
  refundCreditClient,
} from '@/api/customers';
import type { AdminCustomer, CustomerStatus } from '@/types/customer-admin';

interface Props {
  initialCustomers: AdminCustomer[];
}

type StatusFilter = 'ALL' | CustomerStatus;

const STATUS_COLORS: Record<CustomerStatus, string> = {
  ACTIVE:  'var(--teal)',
  FLAGGED: 'var(--rose)',
};

function relativeDate(iso: string | undefined, locale: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(0, 'day');
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (days < 30) return rtf.format(-days, 'day');
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.floor(months / 12), 'year');
}

interface ExpandedState {
  noteText: string;
  refundAmount: string;
  refundReason: string;
  showRefundForm: boolean;
  showNoteForm: boolean;
  saving: '' | 'flag' | 'note' | 'refund';
}

export function CustomerListClient({ initialCustomers }: Props) {
  const t = useTranslations('customers');
  const locale = useLocale();

  const [customers, setCustomers] = useState<AdminCustomer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedState, setExpandedState] = useState<ExpandedState>({
    noteText: '',
    refundAmount: '',
    refundReason: '',
    showRefundForm: false,
    showNoteForm: false,
    saving: '',
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      const matchesStatus = statusFilter === 'ALL' || c.accountStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  function handleRowClick(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setExpandedState({
        noteText: '',
        refundAmount: '',
        refundReason: '',
        showRefundForm: false,
        showNoteForm: false,
        saving: '',
      });
    }
  }

  async function handleFlagToggle(customer: AdminCustomer) {
    const newStatus: CustomerStatus =
      customer.accountStatus === 'FLAGGED' ? 'ACTIVE' : 'FLAGGED';
    // Optimistic update
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, accountStatus: newStatus } : c)),
    );
    setExpandedState((s) => ({ ...s, saving: 'flag' }));
    try {
      await patchCustomerClient(customer.id, newStatus);
    } catch {
      // Rollback on failure
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id ? { ...c, accountStatus: customer.accountStatus } : c,
        ),
      );
    } finally {
      setExpandedState((s) => ({ ...s, saving: '' }));
    }
  }

  async function handleAddNote(customerId: string) {
    const text = expandedState.noteText.trim();
    if (!text) return;
    setExpandedState((s) => ({ ...s, saving: 'note' }));
    try {
      await addCustomerNoteClient(customerId, text);
      // Optimistic: append note
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                notes: [
                  ...c.notes,
                  { text, createdAt: new Date().toISOString(), authorName: 'Admin' },
                ],
              }
            : c,
        ),
      );
      setExpandedState((s) => ({
        ...s,
        noteText: '',
        showNoteForm: false,
        saving: '',
      }));
    } catch {
      setExpandedState((s) => ({ ...s, saving: '' }));
    }
  }

  async function handleRefundCredit(customerId: string) {
    const amount = parseFloat(expandedState.refundAmount);
    if (isNaN(amount) || amount <= 0) return;
    const reason = expandedState.refundReason.trim();
    if (!reason) return;
    setExpandedState((s) => ({ ...s, saving: 'refund' }));
    try {
      await refundCreditClient(customerId, amount, reason);
      setExpandedState((s) => ({
        ...s,
        refundAmount: '',
        refundReason: '',
        showRefundForm: false,
        saving: '',
      }));
    } catch {
      setExpandedState((s) => ({ ...s, saving: '' }));
    }
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--fog-3)',
          }}
        >
          {t('title')}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--ink-4)',
              background: 'var(--ink-2)',
              color: 'var(--fog-2)',
              fontSize: '0.8125rem',
              minWidth: '220px',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label={t('filterByStatus')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--ink-4)',
              background: 'var(--ink-2)',
              color: 'var(--fog-2)',
              fontSize: '0.8125rem',
            }}
          >
            <option value="ALL">{t('filterAll')}</option>
            <option value="ACTIVE">{t('status.ACTIVE')}</option>
            <option value="FLAGGED">{t('status.FLAGGED')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p style={{ color: 'var(--fog-0)', textAlign: 'center', padding: '3rem 0' }}>
          {t('emptyState')}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--ink-4)',
                  color: 'var(--fog-0)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '8px 12px' }}>{t('columns.name')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.phone')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.city')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.bookings')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.lastBooking')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.openComplaints')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.status')}</th>
                <th style={{ padding: '8px 12px' }}>{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const isExpanded = expandedId === customer.id;
                const isSaving = isExpanded && expandedState.saving !== '';
                return (
                  <>
                    {/* Main row */}
                    <tr
                      key={customer.id}
                      onClick={() => handleRowClick(customer.id)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid var(--ink-3)',
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--ink-2)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Name */}
                      <td
                        style={{
                          padding: '10px 12px',
                          color: 'var(--fog-3)',
                          fontWeight: 500,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'color-mix(in srgb, var(--teal) 15%, transparent)',
                              color: 'var(--teal)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {customer.name.slice(0, 2).toUpperCase()}
                          </div>
                          {customer.name}
                        </div>
                      </td>

                      {/* Phone */}
                      <td
                        style={{
                          padding: '10px 12px',
                          color: 'var(--fog-1)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {customer.phone}
                      </td>

                      {/* City */}
                      <td style={{ padding: '10px 12px', color: 'var(--fog-1)' }}>
                        {customer.city}
                      </td>

                      {/* Booking count */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          color: 'var(--fog-2)',
                        }}
                      >
                        {customer.bookingCount}
                      </td>

                      {/* Last booking */}
                      <td style={{ padding: '10px 12px', color: 'var(--fog-0)' }}>
                        {relativeDate(customer.lastBookingDate, locale)}
                      </td>

                      {/* Open complaints */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          color:
                            customer.openComplaintCount > 0
                              ? 'var(--rose)'
                              : 'var(--fog-0)',
                          fontWeight: customer.openComplaintCount > 0 ? 700 : 400,
                        }}
                      >
                        {customer.openComplaintCount}
                      </td>

                      {/* Status pill */}
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: `color-mix(in srgb, ${STATUS_COLORS[customer.accountStatus]} 15%, transparent)`,
                            color: STATUS_COLORS[customer.accountStatus],
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {t(`status.${customer.accountStatus}` as 'status.ACTIVE')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        style={{ padding: '10px 12px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => void handleFlagToggle(customer)}
                          disabled={isSaving}
                          style={{
                            padding: '4px 10px',
                            background:
                              customer.accountStatus === 'FLAGGED'
                                ? 'color-mix(in srgb, var(--teal) 15%, transparent)'
                                : 'color-mix(in srgb, var(--rose) 15%, transparent)',
                            color:
                              customer.accountStatus === 'FLAGGED'
                                ? 'var(--teal)'
                                : 'var(--rose)',
                            border: 'none',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {customer.accountStatus === 'FLAGGED'
                            ? t('actions.unflag')
                            : t('actions.flag')}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr
                        key={`${customer.id}-expanded`}
                        style={{ borderBottom: '1px solid var(--ink-3)' }}
                      >
                        <td
                          colSpan={8}
                          style={{
                            padding: '0 12px 16px 12px',
                            background: 'var(--ink-2)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                              gap: '1.25rem',
                              paddingTop: '12px',
                            }}
                          >
                            {/* Recent Bookings */}
                            <div>
                              <p
                                style={{
                                  margin: '0 0 6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'var(--fog-0)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {t('expandedSection.recentBookings')}
                              </p>
                              {customer.recentBookings.slice(0, 5).length === 0 ? (
                                <p style={{ color: 'var(--fog-0)', fontSize: '0.8rem' }}>
                                  —
                                </p>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                  }}
                                >
                                  {customer.recentBookings.slice(0, 5).map((b, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--fog-1)',
                                        padding: '4px 8px',
                                        background: 'var(--ink-3)',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          color: 'var(--fog-2)',
                                        }}
                                      >
                                        {b.service}
                                      </span>{' '}
                                      · {b.techName} · {relativeDate(b.date, locale)} ·{' '}
                                      <span
                                        style={{
                                          color:
                                            b.status === 'COMPLETED'
                                              ? 'var(--teal)'
                                              : 'var(--marigold)',
                                        }}
                                      >
                                        {b.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Recent Complaints */}
                            <div>
                              <p
                                style={{
                                  margin: '0 0 6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'var(--fog-0)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {t('expandedSection.recentComplaints')}
                              </p>
                              {customer.recentComplaints.slice(0, 3).length === 0 ? (
                                <p style={{ color: 'var(--fog-0)', fontSize: '0.8rem' }}>
                                  —
                                </p>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                  }}
                                >
                                  {customer.recentComplaints.slice(0, 3).map((c, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--fog-1)',
                                        padding: '4px 8px',
                                        background: 'var(--ink-3)',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          color: 'var(--rose)',
                                        }}
                                      >
                                        {c.category}
                                      </span>{' '}
                                      · {relativeDate(c.date, locale)} · {c.resolution}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div>
                              <p
                                style={{
                                  margin: '0 0 6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: 'var(--fog-0)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {t('expandedSection.notes')}
                              </p>
                              {customer.notes.length === 0 && !expandedState.showNoteForm ? (
                                <p style={{ color: 'var(--fog-0)', fontSize: '0.8rem' }}>
                                  —
                                </p>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    marginBottom: '6px',
                                  }}
                                >
                                  {customer.notes.map((n, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--fog-1)',
                                        padding: '4px 8px',
                                        background: 'var(--ink-3)',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <span style={{ color: 'var(--fog-0)' }}>
                                        {n.authorName} · {relativeDate(n.createdAt, locale)}
                                      </span>
                                      <br />
                                      {n.text}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add note form */}
                              {expandedState.showNoteForm ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <textarea
                                    rows={2}
                                    value={expandedState.noteText}
                                    onChange={(e) =>
                                      setExpandedState((s) => ({
                                        ...s,
                                        noteText: e.target.value,
                                      }))
                                    }
                                    placeholder={t('noteForm.placeholder')}
                                    style={{
                                      resize: 'vertical',
                                      padding: '6px 8px',
                                      background: 'var(--ink-1)',
                                      border: '1px solid var(--ink-4)',
                                      color: 'var(--fog-2)',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => void handleAddNote(customer.id)}
                                      disabled={expandedState.saving === 'note'}
                                      style={{
                                        padding: '4px 10px',
                                        background: 'var(--teal)',
                                        color: 'var(--ink-0)',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {t('noteForm.save')}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setExpandedState((s) => ({
                                          ...s,
                                          showNoteForm: false,
                                          noteText: '',
                                        }))
                                      }
                                      aria-label={t('actions.cancel')}
                                      style={{
                                        padding: '4px 8px',
                                        background: 'transparent',
                                        color: 'var(--fog-0)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setExpandedState((s) => ({ ...s, showNoteForm: true }))
                                  }
                                  style={{
                                    padding: '4px 10px',
                                    background: 'transparent',
                                    color: 'var(--marigold)',
                                    border: '1px solid var(--marigold)',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  + {t('actions.addNote')}
                                </button>
                              )}
                            </div>

                            {/* Refund Credit */}
                            <div>
                              {expandedState.showRefundForm ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <p
                                    style={{
                                      margin: '0 0 4px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: 'var(--fog-0)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                    }}
                                  >
                                    {t('actions.refundCredit')}
                                  </p>
                                  <input
                                    type="number"
                                    min={1}
                                    value={expandedState.refundAmount}
                                    onChange={(e) =>
                                      setExpandedState((s) => ({
                                        ...s,
                                        refundAmount: e.target.value,
                                      }))
                                    }
                                    placeholder={t('refundForm.amountLabel')}
                                    style={{
                                      padding: '6px 8px',
                                      background: 'var(--ink-1)',
                                      border: '1px solid var(--ink-4)',
                                      color: 'var(--fog-2)',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                    }}
                                  />
                                  <input
                                    type="text"
                                    value={expandedState.refundReason}
                                    onChange={(e) =>
                                      setExpandedState((s) => ({
                                        ...s,
                                        refundReason: e.target.value,
                                      }))
                                    }
                                    placeholder={t('refundForm.reasonLabel')}
                                    style={{
                                      padding: '6px 8px',
                                      background: 'var(--ink-1)',
                                      border: '1px solid var(--ink-4)',
                                      color: 'var(--fog-2)',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => void handleRefundCredit(customer.id)}
                                      disabled={expandedState.saving === 'refund'}
                                      style={{
                                        padding: '4px 10px',
                                        background: 'var(--teal)',
                                        color: 'var(--ink-0)',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {t('refundForm.submit')}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setExpandedState((s) => ({
                                          ...s,
                                          showRefundForm: false,
                                          refundAmount: '',
                                          refundReason: '',
                                        }))
                                      }
                                      aria-label={t('actions.cancel')}
                                      style={{
                                        padding: '4px 8px',
                                        background: 'transparent',
                                        color: 'var(--fog-0)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setExpandedState((s) => ({
                                      ...s,
                                      showRefundForm: true,
                                    }))
                                  }
                                  style={{
                                    marginTop: '1.5rem',
                                    padding: '4px 10px',
                                    background: 'transparent',
                                    color: 'var(--ember)',
                                    border: '1px solid var(--ember)',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {t('actions.refundCredit')}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
