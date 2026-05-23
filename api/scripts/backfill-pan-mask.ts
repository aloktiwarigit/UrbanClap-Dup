#!/usr/bin/env tsx
/**
 * One-time backfill: scan the technicians container for records with any non-canonical
 * PAN data (panNumber set with null panMaskedNumber, or panMaskedNumber containing a
 * legacy non-canonical mask such as ABCDE####F).
 *
 * For each candidate:
 *  - If panNumber is a canonical raw PAN → mask it → write panMaskedNumber, clear panNumber.
 *  - Otherwise (non-canonical panNumber or non-canonical panMaskedNumber) → clear PAN
 *    fields and escalate kycStatus to MANUAL_REVIEW for admin re-verification via DigiLocker.
 *
 * Usage:
 *   pnpm backfill:pan-mask              — dry run, no writes (default)
 *   pnpm backfill:pan-mask -- --apply   — live writes
 *
 * Requires: COSMOS_CONNECTION_STRING or both COSMOS_ENDPOINT and COSMOS_KEY.
 * Optional: COSMOS_DATABASE (defaults to "homeservices").
 */

import { CosmosClient } from '@azure/cosmos';
import { maskPan } from '../src/services/pan.utils.js';

const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';
const CONTAINER_NAME = 'technicians';
const DRY_RUN = !process.argv.includes('--apply');

const CANONICAL_PAN_MASK = /^X{5}\d{4}[A-Z]$/;

function buildClient(): CosmosClient {
  const cs = process.env.COSMOS_CONNECTION_STRING;
  if (cs) return new CosmosClient(cs);
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  if (!endpoint || !key) {
    console.error('Set COSMOS_CONNECTION_STRING or both COSMOS_ENDPOINT and COSMOS_KEY.');
    process.exit(1);
  }
  return new CosmosClient({ endpoint, key });
}

interface KycSubDoc {
  panNumber?: string | null;
  panMaskedNumber?: string | null;
  kycStatus?: string;
  updatedAt?: string;
}

interface TechDoc {
  id: string;
  kyc?: KycSubDoc;
}

function isCanonicalMask(value: string): boolean {
  return CANONICAL_PAN_MASK.test(value);
}

async function main(): Promise<void> {
  console.log(`backfill-pan-mask — mode: ${DRY_RUN ? 'DRY RUN (pass --apply to write)' : 'LIVE WRITE'}`);

  const container = buildClient().database(DB_NAME).container(CONTAINER_NAME);

  // Query 1: records where panNumber is set and panMaskedNumber is absent/null
  const q1 = container.items
    .query<TechDoc>({
      query: `SELECT c.id, c.kyc FROM c
              WHERE IS_DEFINED(c.kyc.panNumber)
                AND c.kyc.panNumber != null
                AND (NOT IS_DEFINED(c.kyc.panMaskedNumber) OR c.kyc.panMaskedNumber = null)`,
    })
    .fetchAll();

  // Query 2: records where panMaskedNumber is set but does not match canonical X{5}\d{4}[A-Z]
  // Cosmos SQL cannot do regex — fetch all docs with panMaskedNumber set, filter client-side.
  const q2 = container.items
    .query<TechDoc>({
      query: `SELECT c.id, c.kyc FROM c
              WHERE IS_DEFINED(c.kyc.panMaskedNumber)
                AND c.kyc.panMaskedNumber != null`,
    })
    .fetchAll();

  const [r1, r2] = await Promise.all([q1, q2]);

  // Merge: deduplicate by id, prioritise q1 (has raw panNumber)
  const seen = new Set<string>();
  const candidates: TechDoc[] = [];
  for (const doc of r1.resources) {
    seen.add(doc.id);
    candidates.push(doc);
  }
  for (const doc of r2.resources) {
    const masked = doc.kyc?.panMaskedNumber;
    if (masked && !isCanonicalMask(masked) && !seen.has(doc.id)) {
      seen.add(doc.id);
      candidates.push(doc);
    }
  }

  console.log(`Candidates: ${candidates.length}\n`);

  let masked = 0;
  let escalated = 0;

  for (const doc of candidates) {
    const pan = doc.kyc?.panNumber;
    const existingMasked = doc.kyc?.panMaskedNumber;

    // Prefer masking from raw panNumber if available
    const maskedValue = pan ? maskPan(pan) : null;

    if (maskedValue) {
      // Log only the masked output — never log the raw PAN value (PII).
      console.log(`[MASK]      id=${doc.id}  panNumber=<redacted> → "${maskedValue}"`);
      if (!DRY_RUN) {
        await container.item(doc.id, doc.id).patch([
          { op: 'set', path: '/kyc/panMaskedNumber', value: maskedValue },
          { op: 'set', path: '/kyc/panNumber', value: null },
          { op: 'set', path: '/kyc/updatedAt', value: new Date().toISOString() },
        ]);
      }
      masked++;
    } else {
      // Do not log the non-canonical value itself — it may be a raw PAN (PII).
      const reason = pan ? 'panNumber non-canonical' : 'panMaskedNumber non-canonical';
      console.log(`[ESCALATE]  id=${doc.id}  ${reason} → MANUAL_REVIEW`);
      if (!DRY_RUN) {
        await container.item(doc.id, doc.id).patch([
          { op: 'set', path: '/kyc/panNumber', value: null },
          { op: 'set', path: '/kyc/panMaskedNumber', value: null },
          { op: 'set', path: '/kyc/kycStatus', value: 'MANUAL_REVIEW' },
          { op: 'set', path: '/kyc/updatedAt', value: new Date().toISOString() },
        ]);
      }
      escalated++;
    }
  }

  console.log(`\nSummary (${DRY_RUN ? 'dry run — no writes' : 'applied'}):`);
  console.log(`  Masked:    ${masked}`);
  console.log(`  Escalated: ${escalated}`);
  console.log(`  Total:     ${masked + escalated}`);

  if (DRY_RUN && (masked + escalated) > 0) {
    console.log('\nRe-run with --apply to commit these changes.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
