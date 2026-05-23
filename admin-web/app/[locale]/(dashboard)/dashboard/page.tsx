export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { ApiError } from '@/api/client';
import { getServerApiClient } from '@/lib/serverApi';
import { CounterStrip } from '@/components/dashboard/CounterStrip';
import { TechMap } from '@/components/dashboard/TechMap';
import { OrderFeed } from '@/components/dashboard/OrderFeed';
import { UtilStrip } from '@/components/dashboard/UtilStrip';
import { PayoutQueue } from '@/components/dashboard/PayoutQueue';

function handleDashboardApiError(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.status === 401) redirect('/login');
    if (error.status === 403) redirect('/not-authorized');
  }

  throw error;
}

function unwrapDashboardResult<TResponse, TValue>(
  result: PromiseSettledResult<{ data?: TResponse }>,
  readValue: (response: TResponse) => TValue,
  label: string,
): TValue {
  if (result.status === 'rejected') handleDashboardApiError(result.reason);
  if (result.value.data === undefined) {
    throw new Error(`${label} response did not include data`);
  }

  return readValue(result.value.data);
}

export default async function LiveOpsDashboardPage() {
  const client = await getServerApiClient();

  const [summaryResult, techsResult] = await Promise.allSettled([
    client.GET('/v1/admin/dashboard/summary'),
    client.GET('/v1/admin/dashboard/tech-locations'),
  ]);

  const summary = unwrapDashboardResult(
    summaryResult,
    (data) => data.summary,
    'Dashboard summary',
  );

  const techs = unwrapDashboardResult(
    techsResult,
    (data) => data.techs,
    'Technician locations',
  );

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
