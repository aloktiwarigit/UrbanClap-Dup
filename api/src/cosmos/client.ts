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

/** Inject a mock CosmosClient in tests. */
export function _setCosmosClientForTest(mock: CosmosClient): void {
  _client = mock;
}
