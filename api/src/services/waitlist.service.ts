import { createWaitlistEntry } from '../cosmos/repositories/waitlist.repository.js';
import type { WaitlistRequest } from '../schemas/waitlist.schema.js';
import { CATALOGUE_SERVICE_IDS } from '../data/catalogue-ids.js';

export async function joinWaitlist(
  request: WaitlistRequest,
  sourceIp: string,
): Promise<{ ok: true }> {
  if (!(CATALOGUE_SERVICE_IDS as readonly string[]).includes(request.serviceId)) {
    throw new Error('UNKNOWN_SERVICE');
  }
  await createWaitlistEntry({ ...request, sourceIp });
  return { ok: true };
}
