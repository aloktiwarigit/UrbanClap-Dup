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

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}
