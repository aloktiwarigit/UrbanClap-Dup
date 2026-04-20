import type { Metadata } from 'next';
import { OrdersClient } from '@/components/orders/OrdersClient';

export const metadata: Metadata = { title: 'Orders — Homeservices Admin' };

export default function OrdersPage() {
  return <OrdersClient />;
}
