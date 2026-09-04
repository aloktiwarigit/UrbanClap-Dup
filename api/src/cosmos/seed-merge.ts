/**
 * Merge a catalogue seed document with the document currently stored in Cosmos
 * (if any).
 *
 * The seed owns catalogue CONTENT — names, copy, price, includes, photo
 * stages, and so on. It does not own activation or the original creation
 * time: `isActive` is toggled by the owner from the admin dashboard, and
 * `createdAt` should reflect when the document first entered the database,
 * not when it was last re-seeded. A blind upsert of the whole seed document
 * would silently re-activate something the owner had turned off, and would
 * rewrite history on every deploy. When an existing document is present,
 * those two fields are carried forward from it; every other field comes from
 * the seed.
 */
export function mergeSeedDoc<T extends { isActive: boolean; createdAt: string }>(
  seedDoc: T,
  existing: T | undefined,
): T {
  return {
    ...seedDoc,
    isActive: existing?.isActive ?? seedDoc.isActive,
    createdAt: existing?.createdAt ?? seedDoc.createdAt,
  };
}
