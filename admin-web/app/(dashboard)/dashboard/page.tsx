export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createApiClient } from '@/api/client';
import { CounterStrip } from '@/components/dashboard/CounterStrip';
import { TechMap } from '@/components/dashboard/TechMap';
import { OrderFeed } from '@/components/dashboard/OrderFeed';
import { UtilStrip } from '@/components/dashboard/UtilStrip';
import { PayoutQueue } from '@/components/dashboard/PayoutQueue';
import type { components } from '@/api/generated/schema';

type DashboardSummary = components['schemas']['DashboardSummary'];
type TechLocation = components['schemas']['TechLocation'];

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function getServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value ?? '';
  return createApiClient({
    baseUrl: API_BASE,
    headers: () => Promise.resolve({ Authorization: `Bearer ${token}` }),
  });
}

const FALLBACK_SUMMARY: DashboardSummary = {
  bookingsToday: 0,
  gmvToday: 0,
  commissionToday: 0,
  payoutsPending: 0,
  complaintsOpen: 0,
  techsOnDuty: 0,
};

export default async function LiveOpsDashboardPage() {
  const client = await getServerClient();

  const [summaryResult, techsResult] = await Promise.allSettled([
    client.GET('/v1/admin/dashboard/summary'),
    client.GET('/v1/admin/dashboard/tech-locations'),
  ]);

  const summary: DashboardSummary =
    summaryResult.status === 'fulfilled' && summaryResult.value.data
      ? summaryResult.value.data.summary
      : FALLBACK_SUMMARY;

  const techs: TechLocation[] =
    techsResult.status === 'fulfilled' && techsResult.value.data
      ? techsResult.value.data.techs
      : [];

  return (
    <div
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <CounterStrip summary={summary} />

      <div
        className="dashboard-grid dashboard-grid-feed"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <TechMap techs={techs} />
        <OrderFeed />
      </div>

      <div
        className="dashboard-grid dashboard-grid-payout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <UtilStrip />
        <PayoutQueue
          payoutsPending={summary.payoutsPending}
          techCount={summary.techsOnDuty}
        />
      </div>
    </div>
  );
}
