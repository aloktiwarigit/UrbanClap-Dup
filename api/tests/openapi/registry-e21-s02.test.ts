import { describe, it, expect, beforeAll } from 'vitest';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../../src/openapi/registry.js';
import '../../src/openapi/admin-auth.js';

// Generates the document the same way api/src/openapi/build.ts does (import the registry +
// admin-auth side-effects, then run the V31 generator) rather than shelling out to the build
// script, so this test fails fast on a missing/renamed path without needing a file write.
let document: ReturnType<OpenApiGeneratorV31['generateDocument']>;

beforeAll(() => {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  document = generator.generateDocument({
    openapi: '3.1.0',
    info: { title: 'homeservices-api-test', version: '0.0.0-test' },
    servers: [{ url: 'http://localhost:7071/api' }],
  });
});

describe('E21-S02 commission ledger v2 — OpenAPI registry', () => {
  it('documents POST /v1/admin/finance/commission-remittances', () => {
    expect(document.paths?.['/v1/admin/finance/commission-remittances']?.post).toBeDefined();
  });

  it('documents GET /v1/admin/finance/commission-receivables (dashboard v2)', () => {
    expect(document.paths?.['/v1/admin/finance/commission-receivables']?.get).toBeDefined();
  });

  it('documents POST /v1/admin/finance/commission-receivables/recompute', () => {
    expect(document.paths?.['/v1/admin/finance/commission-receivables/recompute']?.post).toBeDefined();
  });

  it('documents GET /v1/admin/finance/commission-receivables/{technicianId} (ledger detail)', () => {
    expect(document.paths?.['/v1/admin/finance/commission-receivables/{technicianId}']?.get).toBeDefined();
  });

  it('documents POST and DELETE /v1/admin/finance/commission-hold/{technicianId}/override', () => {
    const path = document.paths?.['/v1/admin/finance/commission-hold/{technicianId}/override'];
    expect(path?.post).toBeDefined();
    expect(path?.delete).toBeDefined();
  });

  it('documents POST /v1/admin/finance/commission-receivables/settle with a 410 on REMIT', () => {
    const op = document.paths?.['/v1/admin/finance/commission-receivables/settle']?.post;
    expect(op).toBeDefined();
    expect(op?.responses?.['410']).toBeDefined();
  });

  it('documents GET and PUT /v1/admin/catalogue/commission-config', () => {
    const path = document.paths?.['/v1/admin/catalogue/commission-config'];
    expect(path?.get).toBeDefined();
    expect(path?.put).toBeDefined();
  });

  it('documents GET /v1/technicians/me/commission-due (v2)', () => {
    expect(document.paths?.['/v1/technicians/me/commission-due']?.get).toBeDefined();
  });

  it('documents GET /v1/config/technician', () => {
    expect(document.paths?.['/v1/config/technician']?.get).toBeDefined();
  });

  it('no longer references the retired v1-only schemas', () => {
    const schemas = document.components?.schemas ?? {};
    expect(schemas['CommissionConfigDoc']).toBeUndefined();
    expect(schemas['TechnicianOutstandingSummary']).toBeUndefined();
    expect(schemas['CommissionReceivablesDashboard']).toBeUndefined();
    expect(schemas['TechnicianCommissionDue']).toBeUndefined();
  });
});
