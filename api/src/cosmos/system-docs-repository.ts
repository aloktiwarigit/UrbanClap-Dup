import { getSystemContainer } from './client.js';
import {
  TECHNICIAN_CLIENT_CONFIG_DOC_ID,
  type TechnicianClientConfigDoc,
  type UpdateTechnicianClientConfigBody,
} from '../schemas/technician-client-config.js';

const MAX_ATTEMPTS = 3;
const HOLD_REPAIR_DOC_ID = 'hold-repair';
const HOLD_REPAIR_MAX_IDS = 5000;

export interface HoldRepairDoc {
  id: typeof HOLD_REPAIR_DOC_ID;
  technicianIds: string[];
  all: boolean;
  updatedAt: string;
}

/** Strip undefined-valued keys so a partial patch never clobbers existing fields. */
function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}

function isPreconditionFailure(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  return code === 412 || code === 409;
}

/** Generic read-merge-write-under-IfMatch loop shared by the docs below. */
async function readMergeWrite<TDoc extends { id: string }>(
  docId: string,
  computeMerged: (resource: TDoc | undefined) => TDoc,
): Promise<TDoc> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
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
      if (isPreconditionFailure(err) && attempt < MAX_ATTEMPTS - 1) {
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
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
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
        if (isPreconditionFailure(err) && attempt < MAX_ATTEMPTS - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('drainHoldRepair: exhausted retries');
  },
};
