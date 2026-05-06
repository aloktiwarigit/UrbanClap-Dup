import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FinanceClient } from '@/components/finance/FinanceClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('finance');
  return { title: t('metadata.title') };
}

export default function FinancePage() {
  return <FinanceClient />;
}
