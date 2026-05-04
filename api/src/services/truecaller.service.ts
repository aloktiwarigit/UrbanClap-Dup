/**
 * truecaller.service.ts
 *
 * Manages fetching and caching the Truecaller RSA public key used for
 * server-side signature verification.
 *
 * The key is cached in Cosmos DB under the `system` partition with a 24-hour TTL.
 * An in-process memory cache reduces Cosmos reads for hot-path requests.
 */

import { getSystemContainer } from '../cosmos/client.js';

const TRUECALLER_KEY_API = 'https://api4.truecaller.com/v1/key';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const COSMOS_DOC_ID = 'truecaller-pubkey';

interface TruecallerKeyDoc {
  id: string;
  publicKey: string;
  fetchedAt: number;
}

/** In-process memory cache — avoids Cosmos round-trip for the hot path. */
let _memCache: { publicKey: string; fetchedAt: number } | null = null;

/** Reset in-process cache — used by tests only. */
export function _resetCacheForTest(): void {
  _memCache = null;
}

/**
 * Returns the Truecaller RSA public key, using a tiered cache:
 * 1. In-process memory (fastest — no I/O)
 * 2. Cosmos DB cache (survives function cold-starts)
 * 3. Truecaller API (only on cache miss or stale entry)
 */
export async function getTruecallerPublicKey(): Promise<string> {
  const now = Date.now();

  // 1. In-process cache
  if (_memCache && now - _memCache.fetchedAt < CACHE_TTL_MS) {
    return _memCache.publicKey;
  }

  // 2. Cosmos cache
  const container = getSystemContainer();
  const { resource } = await container.item(COSMOS_DOC_ID, COSMOS_DOC_ID).read<TruecallerKeyDoc>();

  if (resource && now - resource.fetchedAt < CACHE_TTL_MS) {
    _memCache = { publicKey: resource.publicKey, fetchedAt: resource.fetchedAt };
    return resource.publicKey;
  }

  // 3. Fetch from Truecaller API
  const freshKey = await fetchFromTruecallerApi();

  const doc: TruecallerKeyDoc = {
    id: COSMOS_DOC_ID,
    publicKey: freshKey,
    fetchedAt: now,
  };

  // Persist to Cosmos (fire-and-forget is acceptable — worst case, next request re-fetches)
  await container.items.upsert(doc);

  // Update in-process cache
  _memCache = { publicKey: freshKey, fetchedAt: now };

  return freshKey;
}

async function fetchFromTruecallerApi(): Promise<string> {
  const response = await fetch(TRUECALLER_KEY_API, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Truecaller public key fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { response?: string };
  if (!json.response) {
    throw new Error('Truecaller public key response missing "response" field');
  }
  return json.response;
}
