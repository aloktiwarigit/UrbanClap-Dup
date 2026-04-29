import { CosmosClient, type Container } from '@azure/cosmos';

let _client: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!_client) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    if (!endpoint || !key) {
      throw new Error('Missing required env vars: COSMOS_ENDPOINT, COSMOS_KEY');
    }
    _client = new CosmosClient({ endpoint, key });
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

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}
