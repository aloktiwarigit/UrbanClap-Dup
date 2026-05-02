'use client';
import { useState } from 'react';
import type { Order } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { OverridePanel } from './OverridePanel';
import { TrustDossierPanel } from '@/components/technicians/TrustDossierPanel';

interface OrderSlideOverProps { order: Order; onClose: () => void; onOrderUpdated?: (updated: Order) => void; }

type Toast = { message: string; type: 'success' | 'error' };

function formatAmount(paise: number): string {
  const inr = paise / 100;
  return `₹${inr.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}

export function OrderSlideOver({ order, onClose, onOrderUpdated }: OrderSlideOverProps) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [toast, setToast] = useState<Toast | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">Order {currentOrder.id.slice(0, 8)}</h2>
          <button aria-label="Close slide-over" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Status</h3><StatusBadge status={currentOrder.status} /></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Customer</h3><p>{currentOrder.customerName}</p><p className="text-gray-500">{currentOrder.customerPhone}</p></section>
          <section>
            <h3 className="text-xs text-gray-500 font-medium mb-1">Technician</h3>
            <p>{currentOrder.technicianName ?? '—'}</p>
            <p className="text-gray-500 font-mono text-xs">{currentOrder.technicianId ?? '—'}</p>
            <TrustDossierPanel technicianId={currentOrder.technicianId} />
          </section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Service</h3><p>{currentOrder.serviceName ?? '—'}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Location</h3><p>{currentOrder.city}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Scheduled</h3><p>{formatDate(currentOrder.scheduledAt)}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Payment</h3><p className="text-lg font-semibold">{formatAmount(currentOrder.amount)}</p></section>
          <section><h3 className="text-xs text-gray-500 font-medium mb-1">Created</h3><p>{formatDate(currentOrder.createdAt)}</p></section>

          {toast && (
            <p role="status" className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {toast.message}
            </p>
          )}

          <OverridePanel
            order={currentOrder}
            onActionComplete={updated => {
              setCurrentOrder(updated);
              setToast({ message: 'Action completed successfully.', type: 'success' });
              onOrderUpdated?.(updated);
            }}
            onError={message => setToast({ message, type: 'error' })}
          />
        </div>
      </div>
    </>
  );
}
