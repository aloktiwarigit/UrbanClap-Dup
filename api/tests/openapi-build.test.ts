import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeAll } from 'vitest';
import SwaggerParser from '@apidevtools/swagger-parser';

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, '..');
const openapiPath = resolve(apiRoot, 'openapi.json');

describe('openapi:build', () => {
  beforeAll(() => {
    execSync('pnpm run openapi:build', { cwd: apiRoot, stdio: 'pipe' });
  });

  it('writes api/openapi.json', () => {
    expect(existsSync(openapiPath)).toBe(true);
  });

  it('emits a valid OpenAPI 3.1 document', async () => {
    const doc = JSON.parse(readFileSync(openapiPath, 'utf8')) as Record<string, unknown>;
    expect(doc['openapi']).toBe('3.1.0');
    await SwaggerParser.validate(openapiPath);
  });

  it('includes /v1/health GET with HealthResponse schema', () => {
    const doc = JSON.parse(readFileSync(openapiPath, 'utf8')) as {
      paths: {
        '/v1/health': {
          get: {
            responses: {
              '200': {
                content: { 'application/json': { schema: { $ref?: string } } };
              };
            };
          };
        };
      };
    };
    const schema =
      doc.paths['/v1/health'].get.responses['200'].content['application/json'].schema;
    expect(schema.$ref).toBe('#/components/schemas/HealthResponse');
  });

  it('emits status as a const "ok"', () => {
    const doc = JSON.parse(readFileSync(openapiPath, 'utf8')) as {
      components: {
        schemas: {
          HealthResponse: {
            properties: { status: { const?: string; enum?: string[] } };
          };
        };
      };
    };
    const status = doc.components.schemas.HealthResponse.properties.status;
    const isConstOk = status.const === 'ok';
    const isSingletonEnumOk =
      Array.isArray(status.enum) && status.enum.length === 1 && status.enum[0] === 'ok';
    expect(isConstOk || isSingletonEnumOk).toBe(true);
  });

  it('info.title is homeservices-api and info.version matches package.json', () => {
    const doc = JSON.parse(readFileSync(openapiPath, 'utf8')) as {
      info: { title: string; version: string };
    };
    const pkg = JSON.parse(
      readFileSync(resolve(apiRoot, 'package.json'), 'utf8'),
    ) as { version: string };
    expect(doc.info.title).toBe('homeservices-api');
    expect(doc.info.version).toBe(pkg.version);
  });

  it('is byte-deterministic across two runs', () => {
    const first = readFileSync(openapiPath, 'utf8');
    execSync('pnpm run openapi:build', { cwd: apiRoot, stdio: 'pipe' });
    const second = readFileSync(openapiPath, 'utf8');
    expect(second).toBe(first);
  });
});
