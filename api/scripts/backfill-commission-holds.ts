#!/usr/bin/env tsx
// Production backfill for E21-S02's commissionHold cache. Run once after `setup-cosmos.ts` has
// seeded the new system docs, and again any time the hold-repair queue needs a full manual
// reconcile outside of the E21-S04 timer.
//
// Run (default, read-only): npx tsx scripts/backfill-commission-holds.ts
//                     apply: npx tsx scripts/backfill-commission-holds.ts --apply
//
// Requires: COSMOS_CONNECTION_STRING, or COSMOS_ENDPOINT + COSMOS_KEY (see src/cosmos/client.ts).
//
// `--dry-run` is the default and performs zero writes — it recomputes every technician's hold in
// memory and reports drift against what's currently stored, via `sweepAllHolds`'s own `log`
// callback (`hold drift (dry-run) <id>: <before state>/<before paise> → <after state>/<after
// paise>`). `--apply` runs the real conditional-patch sweep and persists the recomputed holds.

import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { sweepAllHolds } from '../src/services/commission-hold.service.js';

const KNOWN_FLAGS = new Set(['--dry-run', '--apply']);

/**
 * Exported so the unit test can drive the CLI without spawning a process. `argvArgs` is the
 * flag list only (i.e. `process.argv.slice(2)`).
 */
export async function main(argvArgs: string[]): Promise<void> {
  const unknown = argvArgs.filter((a) => !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(', ')}`);
    console.error('Usage: backfill-commission-holds.ts [--dry-run|--apply]');
    process.exit(2);
    return;
  }

  const apply = argvArgs.includes('--apply');
  if (apply && argvArgs.includes('--dry-run')) {
    console.error('Pass either --dry-run or --apply, not both.');
    process.exit(2);
    return;
  }

  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`commission-hold backfill — mode=${mode}`);
  console.log('');

  const result = await sweepAllHolds({
    dryRun: !apply,
    log: (line: string) => console.log(`  ${line}`),
  });

  console.log('');
  console.log(`recomputed=${result.recomputed} drifted=${result.drifted}`);

  if (!apply) {
    console.log(
      result.drifted > 0
        ? 'Dry-run complete — no writes made. Re-run with --apply to persist the drift above.'
        : 'Dry-run complete — no writes made. No drift found; --apply would be a no-op.',
    );
  } else {
    console.log('Apply complete — commissionHold patched for every technician listed above.');
  }
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main(argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
