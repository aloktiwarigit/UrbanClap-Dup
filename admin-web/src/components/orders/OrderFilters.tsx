export interface FiltersState {
  status: string; city: string; categoryId: string; technicianId: string;
  dateFrom: string; dateTo: string; minAmount: string; maxAmount: string;
  customerPhone: string; page: number;
}

const ALL_STATUSES = ['SEARCHING','ASSIGNED','EN_ROUTE','REACHED','IN_PROGRESS','COMPLETED','CANCELLED','PAID'] as const;

interface OrderFiltersProps { filters: FiltersState; onChange: (f: FiltersState) => void; }

export function OrderFilters({ filters, onChange }: OrderFiltersProps) {
  const selected = filters.status ? filters.status.split(',').filter(Boolean) : [];
  const update = (patch: Partial<FiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium" htmlFor="status-select">Status</label>
        <select id="status-select" aria-label="status" multiple size={3}
          value={selected}
          onChange={e => update({ status: Array.from(e.target.selectedOptions).map(o => o.value).join(',') })}
          className="border rounded px-2 py-1 text-sm w-36">
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <input placeholder="City" value={filters.city} onChange={e => update({ city: e.target.value })} className="border rounded px-2 py-1.5 text-sm" />
      <input placeholder="Phone" value={filters.customerPhone} onChange={e => update({ customerPhone: e.target.value })} className="border rounded px-2 py-1.5 text-sm" />
      <input placeholder="Technician ID" value={filters.technicianId} onChange={e => update({ technicianId: e.target.value })} className="border rounded px-2 py-1.5 text-sm" />
      <input type="date" value={filters.dateFrom} onChange={e => update({ dateFrom: e.target.value })} className="border rounded px-2 py-1.5 text-sm" aria-label="Date from" />
      <input type="date" value={filters.dateTo} onChange={e => update({ dateTo: e.target.value })} className="border rounded px-2 py-1.5 text-sm" aria-label="Date to" />
      <input placeholder="Min ₹" type="number" value={filters.minAmount} onChange={e => update({ minAmount: e.target.value })} className="border rounded px-2 py-1.5 text-sm w-24" />
      <input placeholder="Max ₹" type="number" value={filters.maxAmount} onChange={e => update({ maxAmount: e.target.value })} className="border rounded px-2 py-1.5 text-sm w-24" />
    </div>
  );
}
