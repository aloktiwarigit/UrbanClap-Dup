import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/cosmos/client.js', () => ({
  getCosmosClient: vi.fn(),
  DB_NAME: 'homeservices',
}));

vi.mock('../../src/cosmos/catalogue-repository.js', () => ({
  catalogueRepo: {
    getServiceByIdCrossPartition: vi.fn(),
  },
}));

vi.mock('../../src/cosmos/technician-repository.js', () => ({
  getTechniciansByIds: vi.fn(),
}));

vi.mock('../../src/services/firebaseAdmin.js', () => ({
  getFirebaseAdmin: vi.fn(),
}));

vi.mock('../../src/firebase/admin.js', () => ({
  getStorageDownloadUrl: vi.fn(),
}));

import { getCosmosClient } from '../../src/cosmos/client.js';
import { catalogueRepo } from '../../src/cosmos/catalogue-repository.js';
import { getTechniciansByIds } from '../../src/cosmos/technician-repository.js';
import { getFirebaseAdmin } from '../../src/services/firebaseAdmin.js';
import { getStorageDownloadUrl } from '../../src/firebase/admin.js';
import { queryOrders, getOrderById } from '../../src/cosmos/orders-repository.js';

const sampleOrder = {
  id: 'ord_1', customerId: 'cust_1', customerName: 'Rahul', customerPhone: '9999999999',
  status: 'ASSIGNED', city: 'Bengaluru',
  scheduledAt: new Date().toISOString(), amount: 599, createdAt: new Date().toISOString(),
};

const customerCreatedBooking = {
  id: 'booking_1',
  customerId: 'firebase_uid_123',
  serviceId: 'svc_1',
  categoryId: 'cat_1',
  slotDate: '2026-05-04',
  slotWindow: '10:00-11:00',
  addressText: 'Civil Lines, Ayodhya',
  addressLatLng: { lat: 26.79, lng: 82.2 },
  status: 'PAID',
  paymentOrderId: 'cash_1',
  paymentMethod: 'CASH_ON_SERVICE',
  paymentId: 'cash_on_service_pending',
  paymentSignature: null,
  amount: 50000,
  createdAt: '2026-05-04T04:00:00.000Z',
};

describe('queryOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);
    vi.mocked(getTechniciansByIds).mockResolvedValue([]);
    vi.mocked(getFirebaseAdmin).mockImplementation(() => {
      throw new Error('Firebase unavailable');
    });
    vi.mocked(getStorageDownloadUrl).mockReset();
  });

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

  it('normalizes customer-created booking docs into admin orders', async () => {
    let callCount = 0;
    const container = {
      database: () => ({
        container: () => ({
          items: {
            query: () => ({
              fetchAll: vi.fn().mockImplementation(async () => {
                callCount++;
                return callCount === 1
                  ? { resources: [1] }
                  : { resources: [customerCreatedBooking] };
              }),
            }),
          },
        }),
      }),
    };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue(container);

    const result = await queryOrders({ page: 1, pageSize: 50 });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 'booking_1',
      customerId: 'firebase_uid_123',
      customerName: 'Customer firebase',
      customerPhone: '',
      city: 'Ayodhya',
      scheduledAt: '2026-05-04T10:00:00+05:30',
      amount: 50000,
      status: 'PAID',
    });
  });

  it('hydrates generated customer, service, and technician names when source docs are available', async () => {
    let callCount = 0;
    const container = {
      database: () => ({
        container: () => ({
          items: {
            query: () => ({
              fetchAll: vi.fn().mockImplementation(async () => {
                callCount++;
                return callCount === 1
                  ? { resources: [1] }
                  : { resources: [{ ...customerCreatedBooking, technicianId: 'tech_1' }] };
              }),
            }),
          },
        }),
      }),
    };
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue(container);
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue({ name: 'AC Deep Clean' } as never);
    vi.mocked(getTechniciansByIds).mockResolvedValue([
      { id: 'tech_1', technicianId: 'tech_1', displayName: 'Ravi Kumar' },
    ]);
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      auth: () => ({
        getUsers: vi.fn().mockResolvedValue({
          users: [{ uid: 'firebase_uid_123', displayName: 'alok', phoneNumber: '+919999999999' }],
        }),
      }),
    } as never);

    const result = await queryOrders({ page: 1, pageSize: 50 });

    expect(result.items[0]).toMatchObject({
      customerName: 'alok',
      customerPhone: '+919999999999',
      serviceName: 'AC Deep Clean',
      technicianName: 'Ravi Kumar',
    });
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

  it('date filters include legacy slotDate booking docs', async () => {
    const querySpy = vi.fn().mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
    });
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({ container: () => ({ items: { query: querySpy } }) }),
    });

    await queryOrders({ dateFrom: '2026-05-04', dateTo: '2026-05-04', page: 1, pageSize: 50 });

    const queryText: string = querySpy.mock.calls[0]![0]!.query;
    const parameters = querySpy.mock.calls[0]![0]!.parameters;
    expect(queryText).toContain('c.slotDate >= @dateFromDate');
    expect(queryText).toContain('c.slotDate <= @dateToDate');
    expect(parameters).toContainEqual({ name: '@dateTo', value: '2026-05-04T23:59:59.999Z' });
  });
});

describe('getOrderById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogueRepo.getServiceByIdCrossPartition).mockResolvedValue(null);
    vi.mocked(getTechniciansByIds).mockResolvedValue([]);
    vi.mocked(getFirebaseAdmin).mockImplementation(() => {
      throw new Error('Firebase unavailable');
    });
  });

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

  it('returns normalized order details for customer-created booking docs', async () => {
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({
        container: () => ({
          items: { query: () => ({ fetchAll: vi.fn().mockResolvedValue({ resources: [customerCreatedBooking] }) }) },
        }),
      }),
    });
    const result = await getOrderById('booking_1');
    expect(result).toMatchObject({
      id: 'booking_1',
      city: 'Ayodhya',
      scheduledAt: '2026-05-04T10:00:00+05:30',
    });
  });

  it('adds signed job photo urls on order detail only', async () => {
    vi.mocked(getStorageDownloadUrl)
      .mockResolvedValueOnce('https://signed.example/en-route')
      .mockResolvedValueOnce('https://signed.example/completed');
    (getCosmosClient as ReturnType<typeof vi.fn>).mockReturnValue({
      database: () => ({
        container: () => ({
          items: {
            query: () => ({
              fetchAll: vi.fn().mockResolvedValue({
                resources: [
                  {
                    ...customerCreatedBooking,
                    photos: {
                      COMPLETED: ['bookings/booking_1/photos/tech_1/COMPLETED/2.jpg'],
                      EN_ROUTE: ['bookings/booking_1/photos/tech_1/EN_ROUTE/1.jpg'],
                    },
                  },
                ],
              }),
            }),
          },
        }),
      }),
    });

    const result = await getOrderById('booking_1');

    expect(getStorageDownloadUrl).toHaveBeenCalledWith('bookings/booking_1/photos/tech_1/EN_ROUTE/1.jpg');
    expect(result?.jobPhotoSets).toEqual([
      { stage: 'EN_ROUTE', urls: ['https://signed.example/en-route'] },
      { stage: 'COMPLETED', urls: ['https://signed.example/completed'] },
    ]);
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
