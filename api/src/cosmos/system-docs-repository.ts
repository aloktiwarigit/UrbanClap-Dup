import { getSystemContainer } from './client.js';
import { definedOnly, isPreconditionFailure, MAX_ETAG_ATTEMPTS } from './retry-utils.js';
import {
  TECHNICIAN_CLIENT_CONFIG_DOC_ID,
  type TechnicianClientConfigDoc,
  type UpdateTechnicianClientConfigBody,
} from '../schemas/technician-client-config.js';

const HOLD_REPAIR_DOC_ID = 'hold-repair';
const HOLD_REPAIR_MAX_IDS = 5000;
const INCENTIVE_CONFIG_DOC_ID = 'incentive-config';

/** Raw shape of the `system/incentive-config` doc. E23 owns writing it; not yet parsed with zod. */
export interface IncentiveConfigDoc {
  enabled: boolean;
  milestones: Array<{ jobs: number; bonusPaise: number }>;
  capFractionBps: number;
}

export interface HoldRepairDoc {
  id: typeof HOLD_REPAIR_DOC_ID;
  technicianIds: string[];
  all: boolean;
  updatedAt: string;
}

/** Generic read-merge-write-under-IfMatch loop shared by the docs below. */
async function readMergeWrite<TDoc extends { id: string }>(
  docId: string,
  computeMerged: (resource: TDoc | undefined) => TDoc,
): Promise<TDoc> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ETAG_ATTEMPTS; attempt++) {
    const container = getSystemContainer();
    const { resource, etag } = await container.item(docId, docId).read<TDoc>();
    const merged = computeMerged(resource);

    try {
      if (resource) {
        await container
          .item(docId, docId)
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
  throw lastErr instanceof Error ? lastErr : new Error(`${docId}: exhausted retries`);
}

export const systemDocsRepo = {
  async getTechnicianClientConfig(): Promise<TechnicianClientConfigDoc | null> {
    const { resource } = await getSystemContainer()
      .item(TECHNICIAN_CLIENT_CONFIG_DOC_ID, TECHNICIAN_CLIENT_CONFIG_DOC_ID)
      .read<TechnicianClientConfigDoc>();
    return resource ?? null;
  },

  async patchTechnicianClientConfig(
    body: UpdateTechnicianClientConfigBody,
    updatedBy: string,
  ): Promise<TechnicianClientConfigDoc> {
    return readMergeWrite<TechnicianClientConfigDoc>(
      TECHNICIAN_CLIENT_CONFIG_DOC_ID,
      (resource) => {
        const seedDefault: TechnicianClientConfigDoc = { id: TECHNICIAN_CLIENT_CONFIG_DOC_ID };
        const base = resource ?? seedDefault;
        return {
          ...base,
          ...definedOnly(body),
          features: { ...base.features, ...body.features },
          updatedBy,
          updatedAt: new Date().toISOString(),
        };
      },
    );
  },

  /**
   * Raw point read of `system/incentive-config` — no zod parse. E23 (incentives) owns writing
   * this doc; the technician-config endpoint only needs to pass its fields through untouched,
   * with a null fallback when the doc doesn't exist yet (incentives are dark-launched off).
   */
  async getIncentiveConfig(): Promise<IncentiveConfigDoc | null> {
    const { resource } = await getSystemContainer()
      .item(INCENTIVE_CONFIG_DOC_ID, INCENTIVE_CONFIG_DOC_ID)
      .read<IncentiveConfigDoc>();
    return resource ?? null;
  },

  async enqueueHoldRepair(ids: string[] | 'ALL'): Promise<void> {
    await readMergeWrite<HoldRepairDoc>(HOLD_REPAIR_DOC_ID, (resource) => {
      const existingIds = resource?.technicianIds ?? [];
      const newIds = ids === 'ALL' ? [] : ids;
      const merged = Array.from(new Set([...existingIds, ...newIds])).slice(0, HOLD_REPAIR_MAX_IDS);
      return {
        id: HOLD_REPAIR_DOC_ID,
        technicianIds: merged,
        all: (resource?.all ?? false) || ids === 'ALL',
        updatedAt: new Date().toISOString(),
      };
    });
  },

  async drainHoldRepair(): Promise<{ technicianIds: string[]; all: boolean }> {
    const container = getSystemContainer();
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_ETAG_ATTEMPTS; attempt++) {
      const { resource, etag } = await container
        .item(HOLD_REPAIR_DOC_ID, HOLD_REPAIR_DOC_ID)
        .read<HoldRepairDoc>();

      if (!resource) {
        return { technicianIds: [], all: false };
      }

      const drained = { technicianIds: resource.technicianIds, all: resource.all };
      const cleared: HoldRepairDoc = {
        id: HOLD_REPAIR_DOC_ID,
        technicianIds: [],
        all: false,
        updatedAt: new Date().toISOString(),
      };

      try {
        await container
          .item(HOLD_REPAIR_DOC_ID, HOLD_REPAIR_DOC_ID)
          .replace(cleared, { accessCondition: { type: 'IfMatch', condition: etag ?? '' } });
        return drained;
      } catch (err) {
        lastErr = err;
        if (isPreconditionFailure(err) && attempt < MAX_ETAG_ATTEMPTS - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('drainHoldRepair: exhausted retries');
  },
};
