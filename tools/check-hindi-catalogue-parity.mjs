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
// Codex finding (post-review): the original guard only checked that
// `"<id>" to ` appeared *anywhere* in the Kotlin file. That let a service exist
// in `serviceHindiNames` but be missing from `serviceShortDescriptionsHindi`, a
// fallback string carry a stale rupee figure, or a fallback string drift from
// the seed's own Hindi copy — all silently. This version parses all three
// Kotlin maps and the seed's per-entity Hindi fields, then cross-checks
// presence, price-free text, and value equality.
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

const PRICE_IN_PROSE = /[₹]|\bRs\.?\b|\bINR\b/;

const failures = [];

// ---------------------------------------------------------------------------
// Parse the three Kotlin maps: find `val <name>` ... `mapOf(` ... the matching
// closing `)`, then collect `"key" to "value"` pairs from that slice only.
// ---------------------------------------------------------------------------

function extractKotlinMap(source, mapName) {
  const declRe = new RegExp(`val\\s+${mapName}\\b[\\s\\S]*?mapOf\\(`);
  const decl = declRe.exec(source);
  if (!decl) return null;

  const bodyStart = decl.index + decl[0].length;
  let depth = 1;
  let i = bodyStart;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')') depth--;
  }
  if (depth !== 0) return null; // unbalanced parens — malformed file

  const body = source.slice(bodyStart, i - 1);
  const pairs = new Map();
  for (const m of body.matchAll(/"([^"]+)"\s+to\s+"((?:[^"\\]|\\.)*)"/g)) {
    pairs.set(m[1], m[2]);
  }
  return pairs;
}

const KOTLIN_MAP_NAMES = ['categoryHindiNames', 'serviceHindiNames', 'serviceShortDescriptionsHindi'];
const kotlinMaps = {};
for (const name of KOTLIN_MAP_NAMES) {
  const parsed = extractKotlinMap(kotlin, name);
  if (!parsed) {
    failures.push(`HindiLocaleNames.kt: could not find map "${name}" (has its shape changed?)`);
  } else if (parsed.size === 0) {
    failures.push(`HindiLocaleNames.kt: map "${name}" parsed but is empty`);
  }
  kotlinMaps[name] = parsed;
}

// ---------------------------------------------------------------------------
// Parse the seed: service ids, per-service nameHi/shortDescriptionHi, and
// category ids + nameHi.
// ---------------------------------------------------------------------------

const serviceIds = [...seed.matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);
if (serviceIds.length === 0) {
  console.error('parity: could not parse any service ids from the seed — has its shape changed?');
  process.exit(1);
}

const blocks = seed.split(/^\s{2}\{$/m);

function fieldFromBlock(block, field) {
  const m = new RegExp(`${field}: '((?:[^'\\\\]|\\\\.)*)'`).exec(block);
  return m ? m[1] : undefined;
}

const seedServiceNameHi = new Map();
const seedServiceShortDescHi = new Map();

for (const id of serviceIds) {
  const block = blocks.find((b) => b.includes(`id: '${id}'`));
  if (!block) continue;
  if (!/nameHi:/.test(block)) failures.push(`${id}: missing nameHi in the seed`);
  if (!/shortDescriptionHi:/.test(block)) failures.push(`${id}: missing shortDescriptionHi in the seed`);
  const nameHi = fieldFromBlock(block, 'nameHi');
  const shortDescriptionHi = fieldFromBlock(block, 'shortDescriptionHi');
  if (nameHi !== undefined) seedServiceNameHi.set(id, nameHi);
  if (shortDescriptionHi !== undefined) seedServiceShortDescHi.set(id, shortDescriptionHi);
}

// Category entries are single-line objects: `  { id: '…', name: '…', nameHi: '…', ... },`
const seedCategoryNameHi = new Map();
const categoryIds = [];
for (const m of seed.matchAll(/^ {2}\{ id: '([a-z0-9-]+)',[^\n]*?nameHi: '((?:[^'\\]|\\.)*)'/gm)) {
  categoryIds.push(m[1]);
  seedCategoryNameHi.set(m[1], m[2]);
}
if (categoryIds.length === 0) {
  failures.push('CATEGORIES: could not parse any category ids/nameHi from the seed — has its shape changed?');
}

// ---------------------------------------------------------------------------
// Cross-checks: presence in both service maps, presence in the category map,
// price-free Kotlin text, and seed/Kotlin value equality.
// ---------------------------------------------------------------------------

for (const id of serviceIds) {
  if (kotlinMaps.serviceHindiNames && !kotlinMaps.serviceHindiNames.has(id)) {
    failures.push(`${id}: missing from serviceHindiNames in HindiLocaleNames.kt (old APKs will show English)`);
  }
  if (kotlinMaps.serviceShortDescriptionsHindi && !kotlinMaps.serviceShortDescriptionsHindi.has(id)) {
    failures.push(`${id}: missing from serviceShortDescriptionsHindi in HindiLocaleNames.kt (old APKs will show English)`);
  }
}

for (const id of categoryIds) {
  if (kotlinMaps.categoryHindiNames && !kotlinMaps.categoryHindiNames.has(id)) {
    failures.push(`${id}: missing from categoryHindiNames in HindiLocaleNames.kt (old APKs will show English)`);
  }
}

for (const [mapName, pairs] of Object.entries(kotlinMaps)) {
  if (!pairs) continue;
  for (const [id, value] of pairs) {
    if (PRICE_IN_PROSE.test(value)) {
      failures.push(`${id}: price found in ${mapName} in HindiLocaleNames.kt: "${value}" — render it from basePrice instead`);
    }
  }
}

function compareValues(mapName, kotlinPairs, seedValues, fieldLabel) {
  if (!kotlinPairs) return;
  for (const [id, seedValue] of seedValues) {
    const kotlinValue = kotlinPairs.get(id);
    if (kotlinValue === undefined) continue; // already reported as missing above
    if (kotlinValue !== seedValue) {
      failures.push(`${id}: ${fieldLabel} differs — seed "${seedValue}" vs Kotlin "${kotlinValue}"`);
    }
  }
}

compareValues('categoryHindiNames', kotlinMaps.categoryHindiNames, seedCategoryNameHi, 'nameHi');
compareValues('serviceHindiNames', kotlinMaps.serviceHindiNames, seedServiceNameHi, 'nameHi');
compareValues('serviceShortDescriptionsHindi', kotlinMaps.serviceShortDescriptionsHindi, seedServiceShortDescHi, 'shortDescriptionHi');

// A price in prose goes stale the instant the owner edits the price.
// Extended regex: also check question, answer, triggerCondition, label, name.
for (const [, text] of seed.matchAll(/(?:shortDescription(?:Hi)?|question|answer|triggerCondition|label|name|nameHi): '([^']*)'/g)) {
  if (PRICE_IN_PROSE.test(text)) {
    failures.push(`price found in a description: "${text}" — render it from basePrice instead`);
  }
}

if (failures.length > 0) {
  console.error('Hindi catalogue parity check FAILED:\n');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Hindi catalogue parity OK — ${serviceIds.length} services.`);
