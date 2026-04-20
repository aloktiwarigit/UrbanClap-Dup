import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import { queryOrders, getOrderById } from '../../src/cosmos/orders-repository.js';

const sampleOrder = {
  id: 'ord_1', customerId: 'cust_1', customerName: 'Rahul', customerPhone: '9999999999',
  status: 'ASSIGNED', city: 'Bengaluru',
  scheduledAt: new Date().toISOString(), amount: 599, createdAt: new Date().toISOString(),
};

describe('queryOrders', () => {
  it('returns paginated response with items', async () => {
    // Mock: first call returns count [1], second returns items [sampleOrder]
    let callCount = 0;
    const container = {
      database: () => ({
        container: () => ({
          items: {
            query: () => ({
              fetchAll: vi.fn().mockImplementation(async () => {
                callCount++;
                return callCount === 1
                  ? { resources: [1] }              // count query
                  : { resources: [sampleOrder] };   // data query
              }),
            }),
          },
        }),
      }),
    };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue(container);
    const result = await queryOrders({ page: 1, pageSize: 50 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('ord_1');
  });

  it('includes status filter in query when provided', async () => {
    const querySpy = vi.fn().mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
    });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: querySpy } }) }),
    });
    await queryOrders({ status: ['ASSIGNED'], page: 1, pageSize: 50 });
    const queryText: string = querySpy.mock.calls[0]![0]!.query;
    expect(queryText).toContain('c.status IN');
  });
});

describe('getOrderById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns parsed order when resource present', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({
        container: () => ({
          items: { query: () => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [sampleOrder] }) }) },
        }),
      }),
    });
    const result = await getOrderById('ord_1');
    expect(result?.id).toBe('ord_1');
  });

  it('returns null when order not found', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({
        container: () => ({
          items: { query: () => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [] }) }) },
        }),
      }),
    });
    const result = await getOrderById('nonexistent');
    expect(result).toBeNull();
  });
});
