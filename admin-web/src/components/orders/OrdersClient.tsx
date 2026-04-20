'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import type { Order, OrderListResponse, OrdersQueryParams } from '@/types/order';
import { fetchOrders, fetchAllOrdersForExport } from '@/api/orders';
import { OrdersTable } from './OrdersTable';
import { OrderFilters, type FiltersState } from './OrderFilters';
import { OrderSlideOver } from './OrderSlideOver';
import { exportOrdersCsv } from './exportCsv';

const DEFAULT_FILTERS: FiltersState = {
  status: '', city: '', categoryId: '', technicianId: '',
  dateFrom: '', dateTo: '', minAmount: '', maxAmount: '',
  customerPhone: '', page: 1,
};

function readFiltersFromUrl(sp: URLSearchParams): FiltersState {
  return {
    status: sp.get('status') ?? '',
    city: sp.get('city') ?? '',
    categoryId: sp.get('categoryId') ?? '',
    technicianId: sp.get('technicianId') ?? '',
    dateFrom: sp.get('dateFrom') ?? '',
    dateTo: sp.get('dateTo') ?? '',
    minAmount: sp.get('minAmount') ?? '',
    maxAmount: sp.get('maxAmount') ?? '',
    customerPhone: sp.get('customerPhone') ?? '',
    page: Number(sp.get('page') ?? '1'),
  };
}

function filtersToQueryParams(f: FiltersState): OrdersQueryParams {
  const p: OrdersQueryParams = { page: f.page, pageSize: 50 };
  if (f.status) p.status = f.status;
  if (f.city) p.city = f.city;
  if (f.categoryId) p.categoryId = f.categoryId;
  if (f.technicianId) p.technicianId = f.technicianId;
  if (f.customerPhone) p.customerPhone = f.customerPhone;
  if (f.dateFrom) p.dateFrom = f.dateFrom;
  if (f.dateTo) p.dateTo = f.dateTo;
  if (f.minAmount) p.minAmount = f.minAmount;
  if (f.maxAmount) p.maxAmount = f.maxAmount;
  return p;
}

// DEFAULT_FILTERS is referenced here to document the shape; it is the zero-value
// that URL params fall back to when absent.
void DEFAULT_FILTERS;

export function OrdersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [data, setData] = useState<OrderListResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = readFiltersFromUrl(searchParams);

  const updateUrl = useCallback(
    (patch: Partial<FiltersState>) => {
      const next = { ...filters, ...patch, page: 1 };
      const sp = new URLSearchParams();
      Object.entries(next).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && !(k === 'page' && v === 1)) {
          sp.set(k, String(v));
        }
      });
      startTransition(() => { router.replace(`/orders?${sp}` as Route); });
    },
    [filters, router],
  );

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchOrders(filtersToQueryParams(filters))
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const orders = await fetchAllOrdersForExport(filtersToQueryParams(filters));
      exportOrdersCsv(orders);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <button
          onClick={() => { void handleExport(); }}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? 'Exporting\u2026' : 'Export CSV'}
        </button>
      </div>

      <OrderFilters
        filters={filters}
        onChange={(f) => updateUrl({ ...f, page: 1 })}
      />

      {error && (
        <p className="text-red-600 my-4">{error}</p>
      )}

      {data && (
        <OrdersTable
          orders={data.items}
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          totalPages={data.totalPages}
          isLoading={false}
          onRowClick={setSelectedOrder}
          onPageChange={(p) => updateUrl({ page: p })}
        />
      )}

      {selectedOrder && (
        <OrderSlideOver
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
