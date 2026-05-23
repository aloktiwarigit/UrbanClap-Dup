import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuditLogClient } from '../../../src/components/audit-log/AuditLogClient';
import type { AuditLogEntry } from '../../../src/types/audit-log';

const { getTranslation } = vi.hoisted(() => {
  const dictionaries: Record<string, Record<string, string>> = {
    auditLog: {
      loading: 'Loading',
      'errors.loadFailed': 'Could not load audit log',
      'filters.adminId': 'Admin ID',
      'filters.action': 'Action',
      'filters.resourceType': 'Resource Type',
      'filters.resourceId': 'Resource ID',
      'filters.dateFrom': 'Date from',
      'filters.dateTo': 'Date to',
      'buttons.clearFilters': 'Clear filters',
      'pagination.previous': 'Previous',
      'pagination.next': 'Next',
      'table.columns.timestamp': 'Timestamp',
      'table.columns.adminId': 'Admin ID',
      'table.columns.action': 'Action',
      'table.columns.resourceType': 'Resource Type',
      'table.columns.resourceId': 'Resource ID',
      'emptyStates.noEntries': 'No entries',
    },
  };
  const translations = new Map<string, (key: string) => string>();
  return {
    getTranslation: (ns: string) => {
      let translate = translations.get(ns);
      if (!translate) {
        translate = (key: string) => dictionaries[ns]?.[key] ?? `[${ns}.${key}]`;
        translations.set(ns, translate);
      }
      return translate;
    },
  };
});

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => getTranslation(ns),
  useLocale: () => 'en',
}));

const entry: AuditLogEntry = {
  id: 'audit-1',
  timestamp: '2026-05-08T10:15:00.000Z',
  adminId: 'admin-1',
  role: 'super-admin',
  action: 'order.complete',
  resourceType: 'order',
  resourceId: 'booking-1',
  payload: { status: 'COMPLETED' },
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('AuditLogClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads entries and requests next and previous pages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ entries: [entry], continuationToken: 'next-page' }))
      .mockResolvedValueOnce(jsonResponse({ entries: [], continuationToken: undefined }))
      .mockResolvedValueOnce(jsonResponse({ entries: [entry], continuationToken: undefined }));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuditLogClient />);

    expect(await screen.findByText('admin-1')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const nextUrl = String(fetchMock.mock.calls[1]?.[0] ?? '');
    expect(nextUrl).toContain('continuationToken=next-page');

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it('adds active filters to the request URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ entries: [], continuationToken: undefined }));
    vi.stubGlobal('fetch', fetchMock);

    render(<AuditLogClient />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Admin ID'), { target: { value: 'admin-7' } });
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'admin.login' } });
    fireEvent.change(screen.getByLabelText('Resource Type'), { target: { value: 'booking' } });
    fireEvent.change(screen.getByLabelText('Resource ID'), { target: { value: 'booking-7' } });
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2026-05-08T10:15' } });
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2026-05-09T10:15' } });

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('dateTo='))).toBe(true),
    );
    const lastUrl = String(fetchMock.mock.calls.at(-1)?.[0]);
    expect(lastUrl).toContain('adminId=admin-7');
    expect(lastUrl).toContain('action=admin.login');
    expect(lastUrl).toContain('resourceType=booking');
    expect(lastUrl).toContain('resourceId=booking-7');
    expect(lastUrl).toContain('dateFrom=');
    expect(lastUrl).toContain('dateTo=');
  });

  it('shows API status errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 503)));

    render(<AuditLogClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API error: 503');
  });

  it('shows translated load failures when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<AuditLogClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load audit log');
  });
});
