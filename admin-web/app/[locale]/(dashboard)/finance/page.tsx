import type { Metadata } from 'next';
import { FinanceClient } from '@/components/finance/FinanceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Finance — HomeHeroo admin' };

export default function FinancePage() {
  return <FinanceClient />;
}
