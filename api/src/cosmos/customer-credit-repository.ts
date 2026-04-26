import { getCustomerCreditsContainer } from './client.js';
import type { CustomerCreditDoc } from '../schemas/customer-credit.js';

export const customerCreditRepo = {
  async createCreditIfAbsent(doc: CustomerCreditDoc): Promise<boolean> {
    try {
      await getCustomerCreditsContainer().items.create(doc);
      return true;
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 409) return false;
      throw err;
    }
  },
};
