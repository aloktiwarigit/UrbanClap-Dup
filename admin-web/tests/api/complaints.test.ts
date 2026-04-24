import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createApiClient } from '../../src/api/client';
import {
  listComplaints,
  createComplaint,
  patchComplaint,
  getRepeatOffenders,
} from '../../src/api/complaints';
import type {
  Complaint,
  ComplaintListResponse,
  RepeatOffender,
} from '../../src/types/complaint';

const baseUrl = 'http://localhost:7071/api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const sampleComplaint: Complaint = {
  id: 'c1',
  orderId: 'o1',
  customerId: 'cu1',
  technicianId: 'tech1',
  description: 'Issue with service',
  status: 'NEW',
  internalNotes: [],
  slaDeadlineAt: '2026-04-21T00:00:00.000Z',
  escalated: false,
  createdAt: '2026-04-18T10:00:00.000Z',
  updatedAt: '2026-04-18T10:00:00.000Z',
};

const sampleListResponse: ComplaintListResponse = {
  items: [sampleComplaint],
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

const sampleOffenders: RepeatOffender[] = [
  { technicianId: 'tech1', count: 3 },
  { technicianId: 'tech2', count: 2 },
];

describe('listComplaints', () => {
  it('returns ComplaintListResponse on success', async () => {
    server.use(
      http.get(`${baseUrl}/v1/admin/complaints`, () =>
        HttpResponse.json(sampleListResponse),
      ),
    );
    const client = createApiClient({ baseUrl });
    const result = await listComplaints(client);
    expect(result).toEqual(sampleListResponse);
  });

  it('throws when the request fails', async () => {
    server.use(
      http.get(`${baseUrl}/v1/admin/complaints`, () =>
        HttpResponse.json({ error: 'server error' }, { status: 500 }),
      ),
    );
    const client = createApiClient({ baseUrl });
    await expect(listComplaints(client)).rejects.toThrow();
  });
});

describe('createComplaint', () => {
  it('returns Complaint on success', async () => {
    server.use(
      http.post(`${baseUrl}/v1/admin/complaints`, () =>
        HttpResponse.json(sampleComplaint, { status: 201 }),
      ),
    );
    const client = createApiClient({ baseUrl });
    const result = await createComplaint(client, {
      orderId: 'o1',
      customerId: 'cu1',
      technicianId: 'tech1',
      description: 'Issue with service',
    });
    expect(result).toEqual(sampleComplaint);
  });
});

describe('patchComplaint', () => {
  it('returns updated Complaint on success', async () => {
    const updated: Complaint = { ...sampleComplaint, status: 'INVESTIGATING' };
    server.use(
      http.patch(`${baseUrl}/v1/admin/complaints/c1`, () =>
        HttpResponse.json(updated),
      ),
    );
    const client = createApiClient({ baseUrl });
    const result = await patchComplaint(client, 'c1', { status: 'INVESTIGATING' });
    expect(result).toEqual(updated);
  });
});

describe('getRepeatOffenders', () => {
  it('returns unwrapped RepeatOffender[] from envelope', async () => {
    server.use(
      http.get(`${baseUrl}/v1/admin/complaints/repeat-offenders`, () =>
        HttpResponse.json({ offenders: sampleOffenders }),
      ),
    );
    const client = createApiClient({ baseUrl });
    const result = await getRepeatOffenders(client);
    expect(result).toEqual(sampleOffenders);
    expect(Array.isArray(result)).toBe(true);
  });

  it('throws when the request fails', async () => {
    server.use(
      http.get(`${baseUrl}/v1/admin/complaints/repeat-offenders`, () =>
        HttpResponse.json({ error: 'forbidden' }, { status: 403 }),
      ),
    );
    const client = createApiClient({ baseUrl });
    await expect(getRepeatOffenders(client)).rejects.toThrow();
  });
});
