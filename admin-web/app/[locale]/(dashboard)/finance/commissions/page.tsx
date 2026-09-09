import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CommissionsClient } from '@/components/commissions/CommissionsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('commissions');
  return { title: t('metadata.title') };
}

export default function CommissionsPage() {
  return <CommissionsClient />;
}
