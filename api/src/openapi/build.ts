import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

const here = dirname(fileURLToPath(import.meta.url));

const pkgJson = JSON.parse(
  readFileSync(resolve(here, '../../package.json'), 'utf8'),
) as { name: string; version: string };

const generator = new OpenApiGeneratorV31(registry.definitions);

const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: pkgJson.name,
    version: pkgJson.version,
    description:
      'homeservices-mvp internal API. Generated from Zod schemas — do not hand-edit.',
    contact: {
      name: 'homeservices-mvp maintainers',
      url: 'https://github.com/aloktiwarigit/Urbanclap-dup',
    },
  },
  servers: [
    { url: 'http://localhost:7071/api', description: 'Local Azure Functions runtime' },
  ],
  tags: [{ name: 'system', description: 'Operational / liveness endpoints' }],
});

const outputPath = resolve(here, '../../openapi.json');
const json = JSON.stringify(document, null, 2) + '\n';
writeFileSync(outputPath, json, 'utf8');

console.log(`wrote ${outputPath} (${json.length} bytes)`);
