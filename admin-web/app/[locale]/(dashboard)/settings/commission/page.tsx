import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CommissionSettingsClient } from '@/components/settings/CommissionSettingsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('commissions');
  return { title: t('metadata.settingsTitle') };
}

export default function CommissionSettingsPage() {
  return <CommissionSettingsClient />;
}
