import { CosmosClient, Container } from '@azure/cosmos';

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

export function getWalletLedgerContainer(): Container {
  return getCosmosClient().database(DB_NAME).container('wallet_ledger');
}
