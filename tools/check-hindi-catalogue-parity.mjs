#!/usr/bin/env node
// E22-S01 — Fails CI when catalogue Hindi copy is missing.
//
// The customer app is Hindi-default (ADR-0018). A service added without Hindi
// renders an English label to every customer in Ayodhya, which is a visible
// product defect rather than a cosmetic one. Two sources must stay populated:
//
//   1. api/src/cosmos/seeds/catalogue.ts  — nameHi / shortDescriptionHi (server truth)
//   2. customer-app/.../HindiLocaleNames.kt — the compiled-in fallback for APKs
//      already in the field, which cannot receive the server fields.
//
// Run: node tools/check-hindi-catalogue-parity.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const seedPath = resolve(root, 'api/src/cosmos/seeds/catalogue.ts');
const kotlinPath = resolve(
  root,
  'customer-app/app/src/main/kotlin/com/homeservices/customer/data/catalogue/HindiLocaleNames.kt',
);

const seed = readFileSync(seedPath, 'utf8');
const kotlin = readFileSync(kotlinPath, 'utf8');

const serviceIds = [...seed.matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
if (serviceIds.length === 0) {
  console.error('parity: could not parse any service ids from the seed — has its shape changed?');
  process.exit(1);
}

const failures = [];

for (const id of serviceIds) {
  if (!kotlin.includes(`"${id}" to `)) {
    failures.push(`${id}: missing from HindiLocaleNames.kt (old APKs will show English)`);
  }
}

// Every seeded service must carry server-side Hindi too.
const blocks = seed.split(/^\s{2}\{$/m);
for (const id of serviceIds) {
  const block = blocks.find((b) => b.includes(`id: '${id}'`));
  if (!block) continue;
  if (!/nameHi:/.test(block)) failures.push(`${id}: missing nameHi in the seed`);
  if (!/shortDescriptionHi:/.test(block)) failures.push(`${id}: missing shortDescriptionHi in the seed`);
}

// A price in prose goes stale the instant the owner edits the price.
// Extended regex: also check question, answer, triggerCondition, label, name.
for (const [, text] of seed.matchAll(/(?:shortDescription(?:Hi)?|question|answer|triggerCondition|label|name): '([^']*)'/g)) {
  if (/[₹]|\bRs\.?\b|\bINR\b/.test(text)) {
    failures.push(`price found in a description: "${text}" — render it from basePrice instead`);
  }
}

if (failures.length > 0) {
  console.error('Hindi catalogue parity check FAILED:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Hindi catalogue parity OK — ${serviceIds.length} services.`);
