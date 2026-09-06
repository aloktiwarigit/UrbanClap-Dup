/** Shared helpers for the read-merge-write-under-ETag pattern used by the `system` container repos. */

/** Number of read-merge-write attempts before giving up on a 412/409 precondition failure. */
export const MAX_ETAG_ATTEMPTS = 3;

/** Strip undefined-valued keys so a partial patch never clobbers existing fields. */
export function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}

/** True for a Cosmos ETag precondition failure (412) or conflict (409) — safe to retry the read-merge-write. */
export function isPreconditionFailure(err: unknown): boolean {
  const code = (err as { code?: number })?.code;
  return code === 412 || code === 409;
}
