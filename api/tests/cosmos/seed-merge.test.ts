import { describe, it, expect } from 'vitest';
import { mergeSeedDoc } from '../../src/cosmos/seed-merge.js';

interface Doc {
  id: string;
  isActive: boolean;
  createdAt: string;
  name: string;
}

describe('mergeSeedDoc', () => {
  it('uses the seed values when there is no existing doc', () => {
    const seedDoc: Doc = { id: 'ac-deep-clean', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', name: 'AC Deep Clean' };

    const merged = mergeSeedDoc(seedDoc, undefined);

    expect(merged).toEqual(seedDoc);
  });

  it('preserves an existing deactivated doc even though the seed says active', () => {
    const seedDoc: Doc = { id: 'ac-deep-clean', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', name: 'AC Deep Clean' };
    const existing: Doc = { id: 'ac-deep-clean', isActive: false, createdAt: '2026-01-01T00:00:00.000Z', name: 'AC Deep Clean (old)' };

    const merged = mergeSeedDoc(seedDoc, existing);

    expect(merged.isActive).toBe(false);
  });

  it('preserves the existing older createdAt while every other field comes from the seed', () => {
    const seedDoc: Doc = { id: 'ac-deep-clean', isActive: true, createdAt: '2026-06-01T00:00:00.000Z', name: 'AC Deep Clean' };
    const existing: Doc = { id: 'ac-deep-clean', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', name: 'AC Deep Clean (old)' };

    const merged = mergeSeedDoc(seedDoc, existing);

    expect(merged.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(merged.name).toBe('AC Deep Clean');
    expect(merged.isActive).toBe(true);
  });
});
