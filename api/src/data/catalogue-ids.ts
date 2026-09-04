/**
 * Canonical list of service IDs from the homeservices catalogue.
 * Source of truth: api/src/cosmos/seeds/catalogue.ts — keep in sync when new
 * services are added. Used by the waitlist handler to reject unknown serviceIds
 * without a Cosmos round-trip.
 *
 * TODO(W6): replace with a live Cosmos read + short-lived in-process cache
 * once the catalogue grows past ~50 services (E16-S04b backlog).
 */
export const CATALOGUE_SERVICE_IDS: readonly string[] = [
  'ac-deep-clean',
  'ac-deep-clean-window',
  'ac-gas-refill',
  'ac-installation',
  'water-pump-repair',
  'borewell-servicing',
  'plumbing-leak-fix',
  'plumbing-tap-install',
  'plumbing-pipe-repair',
  'electrical-fan-install',
  'electrical-switchboard-fix',
  'electrical-wiring',
  'ro-installation',
  'ro-service-amc',
] as const;
