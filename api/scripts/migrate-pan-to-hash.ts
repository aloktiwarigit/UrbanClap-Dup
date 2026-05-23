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

  // Strategy 2: panNumber is present — must check for already-masked format FIRST.
  // PAN_REGEX matches XXXXX1234F (valid letters + digits), so we must guard against
  // hashing a masked value as if it were raw input.
  if (kyc.panNumber) {
    // Strategy 2a: known-masked format — copy as panMaskedNumber, hash is not derivable.
    // Only accept: old-style ABCDE####F  OR  new-style XXXXX1234F
    const KNOWN_MASKED = /^(?:[A-Z]{5}#{4}[A-Z]|XXXXX\d{4}[A-Z])$/;
    if (KNOWN_MASKED.test(kyc.panNumber)) {
      return {
        panMaskedNumber: kyc.panNumber,
        panHash: null,
        source: 'pre-masked-no-hash',
      };
    }

    // Strategy 2b: value is not a known-masked format — treat as raw canonical PAN.
    const masked = maskPan(kyc.panNumber);
    if (masked) {
      return {
        panMaskedNumber: masked,
        panHash: hashPan(kyc.panNumber),
        source: 'raw-pan-number',
      };
    }

    // Unrecognised format — leave masked null; keep encrypted blob for future retry
    return { panMaskedNumber: kyc.panMaskedNumber ?? null, panHash: null, source: 'unrecognized-format' };
  }

  // Preserve any mask written on a previous run so retries are idempotent
  return { panMaskedNumber: kyc.panMaskedNumber ?? null, panHash: null, source: 'no-pan-data' };
}

async function run(): Promise<void> {
  console.log(`\nE19-S01 PAN migration (${DRY_RUN ? 'DRY RUN — no writes' : 'LIVE RUN'})\n`);

  const container = getCosmosClient().database(DB_NAME).container('technicians');

  // Fetch only IDs in the initial scan — we re-read each doc fresh before writing
  // to avoid clobbering concurrent updates to non-KYC fields (availability, location, etc.).
  const { resources: idList } = await container.items
    .query<{ id: string }>('SELECT c.id FROM c')
    .fetchAll();

  console.log(`Total technician docs to scan: ${idList.length}\n`);

  let skipped = 0;
  let processed = 0;
  let noAction = 0;
  let errors = 0;

  for (const { id } of idList) {
    try {
      // Re-read the full doc fresh immediately before any write
      const { resource: doc } = await container.item(id, id).read<TechnicianDoc>();
      if (!doc) { skipped++; continue; }

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

      const { panMaskedNumber, panHash, source } = derivePanFields(kyc);

      console.log(
        `[${id}] source=${source} hasMasked=${panMaskedNumber !== null} hasHash=${panHash !== null}`,
      );

      if (!DRY_RUN) {
        const updatedKyc: KycSubdoc = {
          ...kyc,
          panMaskedNumber,
          panHash,
          panNumber: null,
        };
        // Only remove the encrypted blob once a deterministic hash has been derived.
        // If panHash is null the blob may still be decryptable on a future retry.
        if (panHash !== null) {
          delete updatedKyc['panNumberEncrypted'];
        }

        // Write only KYC fields back onto the freshly-read doc — non-KYC fields are
        // taken from the point-read above, so concurrent changes to availability,
        // location, etc. are not overwritten.
        await container.items.upsert({ ...doc, kyc: updatedKyc });
      }

      processed++;
    } catch (err) {
      console.error(`[${id}] ERROR:`, err);
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
