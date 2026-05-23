import { CosmosClient, type Container } from '@azure/cosmos';

let _client: CosmosClient | null = null;

const RETRY_OPTIONS = {
  maxRetryAttemptsOnThrottledRequests: 9,
  maxWaitTimeInSeconds: 30,
} as const;

/**
 * Parse a Cosmos DB connection string into endpoint + key components.
 * Format: AccountEndpoint=https://...;AccountKey=<base64>=;
 */
function parseConnectionString(cs: string): { endpoint: string; key: string } {
  const endpointMatch = /AccountEndpoint=([^;]+)/i.exec(cs);
  const keyMatch = /AccountKey=([^;]+)/i.exec(cs);
  if (!endpointMatch || !keyMatch) {
    throw new Error('Invalid COSMOS_CONNECTION_STRING: missing AccountEndpoint or AccountKey');
  }
  return { endpoint: endpointMatch[1]!, key: keyMatch[1]! };
}

export function getCosmosClient(): CosmosClient {
  if (!_client) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING;
    const userAgentSuffix = `homeservices-api/${process.env.GIT_SHA || 'local'}`;

    if (connectionString) {
      const { endpoint, key } = parseConnectionString(connectionString);
      _client = new CosmosClient({
        endpoint,
        key,
        connectionPolicy: { retryOptions: RETRY_OPTIONS },
        userAgentSuffix,
      });
    } else {
      const endpoint = process.env.COSMOS_ENDPOINT;
      const key = process.env.COSMOS_KEY;
      if (!endpoint || !key) {
        throw new Error('Missing COSMOS_CONNECTION_STRING or COSMOS_ENDPOINT+COSMOS_KEY');
      }
      _client = new CosmosClient({
        endpoint,
        key,
        connectionPolicy: { retryOptions: RETRY_OPTIONS },
        userAgentSuffix,
      });
    }
  }
  return _client;
}

export const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';

export function getCatalogueContainers(): { categories: Container; services: Container } {
  const db = getCosmosClient().database(DB_NAME);
  return {
    categories: db.container('service_categories'),
    services: db.container('services'),
  };
}

export function getBookingsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('bookings');
}

export function getDispatchAttemptsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('dispatch_attempts');
}

export function getBookingEventsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('booking_events');
}

export function getSscLeviesContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('ssc_levies');
}

export function getWalletLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('wallet_ledger');
}

export function getRatingsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('ratings');
}

export function getCustomerCreditsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('customer_credits');
}

export function getWebhookEventsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('webhook_events');
}

export function getSystemContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('system');
}

export function getPendingActionsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('pending_actions');
}

/**
 * E13-S01: Customer credit ledger entries (issued / applied / refunded).
 * Stored in the existing `customer_credits` container, partitioned by /customerId.
 * No new container — the original `CustomerCreditDoc` records remain; we add
 * new `CustomerCreditLedgerDoc` records alongside them with type='CREDIT_APPLIED'.
 */
export function getCustomerCreditLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('customer_credits');
}

/**
 * E13-S01: Applied-credit idempotency dedup.
 * Separate container so TTL can be set at the container level (86400 s = 24h).
 * Partitioned by /customerId (same access pattern as credits).
 */
export function getAppliedCreditIdempotencyContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('applied_credit_idempotency');
}

/**
 * E16-S02: Slot holds for conflict locking.
 * Partitioned by /servicePartitionKey ("<serviceId>|<date>"). Default TTL = 30 s.
 * commitHold sets ttl=-1 on committed docs to make them permanent.
 */
export function getSlotHoldsContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('slot_holds');
}

/**
 * E11-S05b-2: Per-incident AES key docs. Partitioned by /customerId.
 * defaultTtl=604800 (7 days) set at provisioning time — see infra/firebase/sos-audio-lifecycle.json
 * and docs/runbook.md → "SOS audio retention".
 */
export function getSosIncidentKeysContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('sos_incident_keys');
}

/**
 * E19-S02: FCM device tokens — one doc per (userId, deviceToken) pair.
 * Partitioned by /userId for single-partition reads per user.
 * No container-level TTL; stale docs pruned manually by a daily timer trigger.
 */
export function getDeviceTokensContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('device_tokens');
}

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}
