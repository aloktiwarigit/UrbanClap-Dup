import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Identifiers that mean "money leaves the platform". None may appear in the incentive module. */
export const PAYOUT_TOKENS = /\b(payoutPaise|payoutAmount|payablePaise|netPayable|transferPaise|razorpayTransferId|RazorpayRouteService|createRouteTransfer)\b/;
/** Identifiers that mean "an incentive award". None may appear in a money-out file. */
export const INCENTIVE_TOKENS = /\b(IncentiveAwardDoc|IncentiveAwardWriteSchema|incentiveAwardId|INCENTIVE_AWARD|applyAward|listAwards|incentiveRepo)\b/;

const INCENTIVE_FILES = [
  'src/services/incentive.service.ts',
  'src/schemas/incentive.ts',
  'src/cosmos/incentive-repository.ts',
  'src/functions/trigger-incentive-weekly.ts',
];
/** Files that actually move money out of the platform. */
const PAYOUT_FILES = [
  'src/functions/admin/finance/approve-payouts.ts',
  'src/functions/admin/finance/payout-queue.ts',
  'src/functions/admin/finance/weekly-aggregate.ts',
  'src/functions/trigger-next-day-payout.ts',
  'src/services/razorpayRoute.service.ts',
];

const read = (rel: string) => readFileSync(resolve(API_ROOT, rel), 'utf8');
const scan = (rel: string, re: RegExp) =>
  read(rel).split('\n')
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    // A comment naming the forbidden concept is documentation, not a payout path.
    .filter(({ line }) => !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('/*'))
    .filter(({ line }) => re.test(line))
    .map(({ line, n }) => `${rel}:${n}: ${line}`);

describe('incentives are credit-only (spec §7.8, ADR-0035)', () => {
  it('no payout-shaped identifier appears anywhere in the incentive module', () => {
    const v = INCENTIVE_FILES.flatMap((f) => scan(f, PAYOUT_TOKENS));
    expect(v, `Payout identifiers in the incentive module:\n${v.join('\n')}`).toEqual([]);
  });

  it('no incentive identifier appears in any file that moves money out', () => {
    const v = PAYOUT_FILES.flatMap((f) => scan(f, INCENTIVE_TOKENS));
    expect(v, `Incentive identifiers in a payout path:\n${v.join('\n')}`).toEqual([]);
  });

  it('the award schema declares no payout-shaped field', () => {
    // §7.8's "static test: no payout* field on award docs", checked against the schema
    // declaration itself rather than a sample document.
    const src = read('src/schemas/incentive.ts');
    const block = src.slice(src.indexOf('const awardShape'), src.indexOf('IncentiveAwardWriteSchema'));
    expect(block.match(/^\s*(\w*payout\w*|\w*payable\w*|\w*transfer\w*)\s*:/gim) ?? []).toEqual([]);
  });

  it('the award WRITE schema is strict, so an unknown field cannot be persisted', () => {
    expect(read('src/schemas/incentive.ts'))
      .toMatch(/export const IncentiveAwardWriteSchema = z\.object\(awardShape\)\.strict\(\)/);
  });
});
