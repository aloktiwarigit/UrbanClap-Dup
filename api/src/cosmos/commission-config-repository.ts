import { getSystemContainer } from './client.js';
import {
  COMMISSION_CONFIG_DOC_ID,
  type CommissionConfigDoc,
} from '../schemas/commission-config.js';

export const commissionConfigRepo = {
  async getCommissionConfig(): Promise<CommissionConfigDoc | null> {
    const { resource } = await getSystemContainer()
      .item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
      .read<CommissionConfigDoc>();
    return resource ?? null;
  },

  async upsertCommissionConfig(
    defaultCommissionBps: number,
    updatedBy: string,
  ): Promise<CommissionConfigDoc> {
    const doc: CommissionConfigDoc = {
      id: COMMISSION_CONFIG_DOC_ID,
      defaultCommissionBps,
      updatedBy,
      updatedAt: new Date().toISOString(),
    };
    await getSystemContainer().items.upsert<CommissionConfigDoc>(doc);
    return doc;
  },
};
