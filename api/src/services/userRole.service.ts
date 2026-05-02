import { getCosmosClient, DB_NAME } from '../cosmos/client.js';

const TECHNICIANS_CONTAINER = 'technicians';

/**
 * Authoritative role lookup. The technicians container holds a doc per uid for
 * every onboarded partner; absence implies a customer (or unknown user, which
 * the caller should treat as customer for the purpose of self-service rights
 * endpoints — there's no PII to read or erase that wouldn't otherwise be
 * scoped by the uid filter).
 *
 * Critically, this is NOT derived from a client-supplied header. DPDP §12
 * cascade depth depends on the role; an attacker who could spoof CUSTOMER
 * could persuade us to skip the technician hard-delete cascade.
 */
export async function inferUserRole(uid: string): Promise<'CUSTOMER' | 'TECHNICIAN'> {
  try {
    const { resource } = await getCosmosClient()
      .database(DB_NAME)
      .container(TECHNICIANS_CONTAINER)
      .item(uid, uid)
      .read<Record<string, unknown>>();
    return resource ? 'TECHNICIAN' : 'CUSTOMER';
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 404) return 'CUSTOMER';
    throw err;
  }
}
