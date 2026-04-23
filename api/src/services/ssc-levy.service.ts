// api/src/services/ssc-levy.service.ts
import { getMessaging } from 'firebase-admin/messaging';
import { EmailClient } from '@azure/communication-email';
import { getCosmosClient, DB_NAME } from '../cosmos/client.js';
import type { SscLevyDoc } from '../schemas/ssc-levy.js';

const LEVY_RATE = 0.01 as const;

export function getPriorQuarter(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  if (month === 1) return `${year - 1}-Q4`;
  if (month === 4) return `${year}-Q1`;
  if (month === 7) return `${year}-Q2`;
  return `${year}-Q3`;
}

export function quarterBounds(quarter: string): { fromIso: string; toIso: string } {
  const parts = quarter.split('-');
  const yearStr = parts[0]!;
  const qStr = parts[1]!;
  const year = Number(yearStr);
  const q = Number(qStr.replace('Q', ''));
  const starts = ['', `${year}-01-01`, `${year}-04-01`, `${year}-07-01`, `${year}-10-01`];
  const ends   = ['', `${year}-03-31`, `${year}-06-30`, `${year}-09-30`, `${year}-12-31`];
  return {
    fromIso: `${starts[q]}T00:00:00.000Z`,
    toIso:   `${ends[q]}T23:59:59.999Z`,
  };
}

export function computeLevyAmount(gmv: number): number {
  return Math.round(gmv * LEVY_RATE);
}

export async function calculateQuarterlyGmv(fromIso: string, toIso: string): Promise<number> {
  const { resources } = await getCosmosClient()
    .database(DB_NAME)
    .container('bookings')
    .items.query<number>({
      query: `SELECT VALUE SUM(c.amount) FROM c
              WHERE (c.status = 'PAID' OR c.status = 'COMPLETED')
                AND c.createdAt >= @from
                AND c.createdAt <= @to`,
      parameters: [
        { name: '@from', value: fromIso },
        { name: '@to', value: toIso },
      ],
    })
    .fetchAll();
  return resources[0] ?? 0;
}

export async function sendOwnerFcmNotification(levy: SscLevyDoc): Promise<void> {
  await getMessaging().send({
    topic: 'owner-alerts',
    data: {
      type: 'SSC_LEVY_PENDING',
      levyId: levy.id,
      quarter: levy.quarter,
      levyAmount: String(levy.levyAmount),
    },
    notification: {
      title: 'SSC Levy Approval Required',
      body: `Quarter ${levy.quarter} levy of ₹${(levy.levyAmount / 100).toFixed(2)} awaits approval.`,
    },
  });
}

export async function sendOwnerEmail(levy: SscLevyDoc): Promise<void> {
  const connectionString = process.env['ACS_CONNECTION_STRING'];
  const senderAddress = process.env['ACS_SENDER_ADDRESS'];
  const ownerEmail = process.env['SSC_OWNER_EMAIL'];
  if (!connectionString || !senderAddress || !ownerEmail) {
    console.warn('ACS email not configured — skipping SSC levy email notification');
    return;
  }
  const client = new EmailClient(connectionString);
  const subject = `[Action Required] SSC Levy ${levy.quarter} — ₹${(levy.levyAmount / 100).toFixed(2)}`;
  const body = [
    `Quarter: ${levy.quarter}`,
    `GMV: ₹${(levy.gmv / 100).toFixed(2)}`,
    `Levy rate: ${(levy.levyRate * 100).toFixed(0)}%`,
    `Levy amount: ₹${(levy.levyAmount / 100).toFixed(2)}`,
    '',
    `Approve: POST /v1/admin/compliance/ssc-levy/${levy.id}/approve`,
  ].join('\n');
  const poller = await client.beginSend({
    senderAddress,
    recipients: { to: [{ address: ownerEmail }] },
    content: { subject, plainText: body },
  });
  await poller.pollUntilDone();
}
