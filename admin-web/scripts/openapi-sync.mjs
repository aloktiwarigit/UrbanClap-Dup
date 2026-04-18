import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../api/openapi.json');
const dest = resolve(here, '../src/api/generated/openapi.json');

mkdirSync(dirname(dest), { recursive: true });
const bytes = readFileSync(source, 'utf8');
writeFileSync(dest, bytes, 'utf8');
console.log(`copied ${bytes.length} bytes → ${dest}`);
