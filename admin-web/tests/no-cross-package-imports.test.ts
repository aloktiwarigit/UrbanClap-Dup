import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const adminWebRoot = resolve(here, '..');
const srcRoot = resolve(adminWebRoot, 'src');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('no cross-package imports', () => {
  it('no admin-web src/ file imports from ../../../api/ at runtime', () => {
    const offenders: string[] = [];
    for (const full of walk(srcRoot)) {
      if (full.includes(join('src', 'api', 'generated'))) continue;
      const contents = readFileSync(full, 'utf8');
      if (/from\s+['"](\.\.\/){2,}api\//.test(contents)) {
        offenders.push(full);
      }
      if (/require\(\s*['"](\.\.\/){2,}api\//.test(contents)) {
        offenders.push(full);
      }
    }
    expect(offenders).toEqual([]);
  });
});
