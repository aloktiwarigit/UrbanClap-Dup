#!/usr/bin/env tsx
/**
 * E19-S01 migration: backfill panMaskedNumber + panHash for all technician docs
 * that still have a legacy panNumber or panNumberEncrypted field.
 *
 * Usage:
 *   pnpm tsx api/scripts/migrate-pan-to-hash.ts --dry-run   # preview only
 *   pnpm tsx api/scripts/migrate-pan-to-hash.ts             # live run
 *
 * Idempotent: docs that already have panHash and no panNumber are skipped.
 * Safe to run multiple times.
 *
 * Prerequisites:
 *   - COSMOS_CONNECTION_STRING (or endpoint+key) env vars set
 *   - COSMOS_PAN_ENCRYPTION_KEY set (needed to decrypt legacy panNumberEncrypted blobs)
 *   - COSMOS_DATABASE set
 */

import { getCosmosClient, DB_NAME } from '../src/cosmos/client.js';
import { decryptPan } from '../src/services/piiCrypto.service.js';
import { maskPan, hashPan } from '../src/services/pan.utils.js';
import type { EncryptedPan } from '../src/schemas/kyc.js';

const DRY_RUN = process.argv.includes('--dry-run');

interface KycSubdoc {
  panNumber?: string | null;
  panMaskedNumber?: string | null;
  panHash?: string | null;
  panNumberEncrypted?: EncryptedPan;
  [key: string]: unknown;
}

interface TechnicianDoc {
  id: string;
  kyc?: KycSubdoc;
  [key: string]: unknown;
}

function derivePanFields(kyc: KycSubdoc): {
  panMaskedNumber: string | null;
  panHash: string | null;
  source: string;
} {
  // Strategy 1: decrypt the AES-GCM blob → get raw PAN → hash + mask
  if (kyc.panNumberEncrypted) {
    try {
      const raw = decryptPan(kyc.panNumberEncrypted);
      const masked = maskPan(raw);
      if (masked) {
        return {
          panMaskedNumber: masked,
          panHash: hashPan(raw),
          source: 'decrypted',
        };
      }
    } catch {
      // Blob corrupt or key rotation — fall through to next strategy
    }
  }

  // Strategy 2: panNumber contains a raw canonical PAN (pre-masking era docs)
  if (kyc.panNumber) {
    const masked = maskPan(kyc.panNumber);
    if (masked) {
      return {
        panMaskedNumber: masked,
        panHash: hashPan(kyc.panNumber),
        source: 'raw-pan-number',
      };
    }

    // Strategy 3: panNumber is already masked — copy as panMaskedNumber, hash uncomputable
    return {
      panMaskedNumber: kyc.panNumber,
      panHash: null,
      source: 'pre-masked-no-hash',
    };
  }

  return { panMaskedNumber: null, panHash: null, source: 'no-pan-data' };
}

async function run(): Promise<void> {
  console.log(`\nE19-S01 PAN migration (${DRY_RUN ? 'DRY RUN — no writes' : 'LIVE RUN'})\n`);

  const container = getCosmosClient().database(DB_NAME).container('technicians');

  const { resources: docs } = await container.items
    .query<TechnicianDoc>('SELECT * FROM c')
    .fetchAll();

  console.log(`Total technician docs fetched: ${docs.length}\n`);

  let skipped = 0;
  let processed = 0;
  let noAction = 0;
  let errors = 0;

  for (const doc of docs) {
    const kyc = doc.kyc;

    if (!kyc) {
      skipped++;
      continue;
    }

    // Idempotent: already migrated
    if (kyc.panHash && !kyc.panNumber) {
      skipped++;
      continue;
    }

    // Nothing to migrate
    if (!kyc.panNumber && !kyc.panNumberEncrypted) {
      noAction++;
      continue;
    }

    try {
      const { panMaskedNumber, panHash, source } = derivePanFields(kyc);

      console.log(
        `[${doc.id}] source=${source} panMaskedNumber=${panMaskedNumber} panHash=${panHash ? `${panHash.slice(0, 8)}...` : null}`,
      );

      if (!DRY_RUN) {
        const updatedKyc: KycSubdoc = {
          ...kyc,
          panMaskedNumber,
          panHash,
          panNumber: null,
        };
        // Remove legacy encrypted blob — no longer needed once hash exists
        delete updatedKyc['panNumberEncrypted'];

        await container.items.upsert({ ...doc, kyc: updatedKyc });
      }

      processed++;
    } catch (err) {
      console.error(`[${doc.id}] ERROR:`, err);
      errors++;
    }
  }

  console.log(
    `\nSummary: processed=${processed} skipped(already-done)=${skipped} no-action=${noAction} errors=${errors}`,
  );
  if (DRY_RUN) {
    console.log('DRY RUN complete — no Cosmos writes performed.');
  } else {
    console.log('Migration complete.');
    if (errors > 0) {
      console.warn(`⚠ ${errors} doc(s) failed — re-run after investigating.`);
      process.exitCode = 1;
    }
  }
}

run().catch((err: unknown) => {
  console.error('Fatal:', err);
  process.exit(1);
});
