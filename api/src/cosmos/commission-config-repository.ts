import { getSystemContainer } from './client.js';
import { definedOnly, isPreconditionFailure, MAX_ETAG_ATTEMPTS } from './retry-utils.js';
import {
  COMMISSION_CONFIG_DOC_ID,
  toEffectiveConfig,
  type CommissionConfigDoc,
  type UpdateCommissionConfigBody,
} from '../schemas/commission-config.js';

export const commissionConfigRepo = {
  async getCommissionConfig(): Promise<CommissionConfigDoc | null> {
    const { resource } = await getSystemContainer()
      .item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
      .read<CommissionConfigDoc>();
    return resource ?? null;
  },

  /**
   * Read-merge patch under an ETag: preserves fields the caller didn't touch
   * (e.g. a bps-only edit must not wipe warn/block thresholds). Creates the
   * doc, seeded with the platform default bps, when it doesn't exist yet.
   * Validates warn < block on the merged result BEFORE any write.
   */
  async patchCommissionConfig(
    patch: UpdateCommissionConfigBody,
    updatedBy: string,
  ): Promise<CommissionConfigDoc> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_ETAG_ATTEMPTS; attempt++) {
      const container = getSystemContainer();
      const { resource, etag } = await container
        .item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
        .read<CommissionConfigDoc>();

      const seedDefault: CommissionConfigDoc = {
        id: COMMISSION_CONFIG_DOC_ID,
        defaultCommissionBps: 2200,
        updatedBy,
        updatedAt: new Date().toISOString(),
      };

      const base = resource ?? seedDefault;
      const merged: CommissionConfigDoc = {
        ...base,
        ...definedOnly(patch),
        defaultCommissionBps: patch.defaultCommissionBps ?? base.defaultCommissionBps,
        updatedBy,
        updatedAt: new Date().toISOString(),
      };

      const effective = toEffectiveConfig(merged);
      if (effective.warnThresholdPaise >= effective.blockThresholdPaise) {
        throw Object.assign(new Error('THRESHOLD_ORDER'), { code: 'THRESHOLD_ORDER' });
      }

      try {
        if (resource) {
          await container
            .item(COMMISSION_CONFIG_DOC_ID, COMMISSION_CONFIG_DOC_ID)
            .replace(merged, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
        } else {
          await container.items.create(merged);
        }
        return merged;
      } catch (err) {
        lastErr = err;
        if (isPreconditionFailure(err) && attempt < MAX_ETAG_ATTEMPTS - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('patchCommissionConfig: exhausted retries');
  },
};
