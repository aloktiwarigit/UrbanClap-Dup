import { describe, it, expect } from 'vitest';

import en from '../../messages/en.json';
import hi from '../../messages/hi.json';

type Json = Record<string, unknown>;

function isPlainObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Every leaf key path under `obj`, dot-joined (e.g. `detail.balance.total`). A "leaf" is any
 * value that is not itself a plain object — every commissions message is a flat string or an
 * ICU plural/interpolation string, never an array, so this is the full recursive descent.
 */
function leafPaths(obj: Json, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return isPlainObject(value) ? leafPaths(value, path) : [path];
  });
}

/** Same recursive descent as `leafPaths`, but keeping the leaf value alongside its path. */
function leafEntries(obj: Json, prefix = ''): Array<[string, unknown]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return isPlainObject(value) ? leafEntries(value, path) : [[path, value] as [string, unknown]];
  });
}

describe('commissions i18n parity', () => {
  const enCommissions = en.commissions as unknown as Json;
  const hiCommissions = hi.commissions as unknown as Json;

  it('both locales define a commissions namespace', () => {
    expect(enCommissions).toBeTruthy();
    expect(hiCommissions).toBeTruthy();
  });

  const enPaths = leafPaths(enCommissions).sort();
  const hiPaths = leafPaths(hiCommissions).sort();

  it('every en leaf key exists in hi', () => {
    const hiSet = new Set(hiPaths);
    const missingFromHi = enPaths.filter((path) => !hiSet.has(path));
    expect(missingFromHi).toEqual([]);
  });

  it('every hi leaf key exists in en', () => {
    const enSet = new Set(enPaths);
    const extraInHi = hiPaths.filter((path) => !enSet.has(path));
    expect(extraInHi).toEqual([]);
  });

  it('key sets match exactly, recursively (both directions combined)', () => {
    expect(hiPaths).toEqual(enPaths);
  });

  // Any Hindi string that is byte-identical to its English counterpart is either an untranslated
  // placeholder or an English fallback that slipped through — both are the owner-facing money
  // misreading this test exists to catch. "UPI" is the one legitimate exception: it's a proper
  // acronym (Unified Payments Interface), never localized, and both locales spell it in the same
  // three Latin letters. We don't assume that's the only one — we scan for every identical pair
  // and fail unless it's on this explicit allow-list, so a future accidental copy-paste (e.g. a
  // reused amount placeholder string, or a key added to hi.json without translating it) is
  // caught rather than silently matching the list's shape.
  const KNOWN_LEGITIMATE_IDENTICAL_KEYS = ['remittance.fields.methodUpi'];

  it('no Hindi value is byte-identical to its English counterpart, except the known legitimate cases', () => {
    const enMap = new Map(leafEntries(enCommissions));
    const hiMap = new Map(leafEntries(hiCommissions));

    const identical = enPaths.filter((path) => {
      const enValue = enMap.get(path);
      const hiValue = hiMap.get(path);
      return typeof enValue === 'string' && typeof hiValue === 'string' && enValue === hiValue;
    });

    expect(identical.sort()).toEqual([...KNOWN_LEGITIMATE_IDENTICAL_KEYS].sort());
  });

  it('the known-legitimate identical value really is the untranslatable "UPI" acronym', () => {
    // Guards against the allow-list entry above being repurposed to cover something that
    // shouldn't be exempt — the exemption is for this exact string, not for the key path.
    const enMap = new Map(leafEntries(enCommissions));
    const hiMap = new Map(leafEntries(hiCommissions));
    expect(enMap.get('remittance.fields.methodUpi')).toBe('UPI');
    expect(hiMap.get('remittance.fields.methodUpi')).toBe('UPI');
  });
});
