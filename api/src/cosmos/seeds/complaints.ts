import { getCosmosClient, DB_NAME } from '../client.js';

async function provision(): Promise<void> {
  const db = getCosmosClient().database(DB_NAME);

  await db.containers.createIfNotExists({
    id: 'complaints',
    partitionKey: '/id',
    defaultTtl: -1,
    indexingPolicy: {
      indexingMode: 'consistent',
      includedPaths: [{ path: '/*' }],
      excludedPaths: [{ path: '/internalNotes/*' }],
    },
  });

  console.log('complaints container ready.');
}

provision().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
