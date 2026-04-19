import { CosmosClient } from '@azure/cosmos';

let _client: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!_client) {
    _client = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!,
    });
  }
  return _client;
}

export const DB_NAME = process.env.COSMOS_DATABASE ?? 'homeservices';
