import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TechnicianLedgerClient } from '@/components/commissions/TechnicianLedgerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('commissions');
  return { title: t('metadata.detailTitle') };
}

interface PageProps {
  params: Promise<{ technicianId: string }>;
}

export default async function CommissionTechnicianDetailPage({ params }: PageProps) {
  const { technicianId } = await params;
  return <TechnicianLedgerClient technicianId={technicianId} />;
}
