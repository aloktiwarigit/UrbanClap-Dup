import type { Metadata } from 'next';
import { getServerApiClient } from '@/lib/serverApi';
import { listTechnicians } from '@/api/technicians';
import { TechnicianRosterClient } from './TechnicianRosterClient';
import type { AdminTechnician } from '@/types/technician-admin';

export const metadata: Metadata = { title: 'Technicians — HomeHeroo Admin' };
export const dynamic = 'force-dynamic';

export default async function TechniciansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const client = await getServerApiClient();

  let technicians: AdminTechnician[] = [];
  try {
    const result = await listTechnicians(client);
    technicians = result.technicians;
  } catch {
    // Network failure or API down — show empty state
  }

  return <TechnicianRosterClient initialTechnicians={technicians} />;
}
