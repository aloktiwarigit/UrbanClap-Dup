#!/usr/bin/env tsx
// Seed 10 test technicians spread across Ayodhya, UP rural pilot region.
// Run: pnpm seed:technicians
// Requires: COSMOS_ENDPOINT and COSMOS_KEY env vars.

import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { getCosmosClient, DB_NAME } from '../src/cosmos/client.js';
import type { TechnicianProfile } from '../src/schemas/technician.js';

const NOW = new Date().toISOString();
const CONTAINER = 'technicians';

export const TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'tech-ayd-001',
    technicianId: 'tech-ayd-001',
    location: { type: 'Point', coordinates: [82.1968, 26.7913] }, // Ram Janmabhoomi area
    skills: ['ac-deep-clean', 'ac-gas-refill', 'ac-installation'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 8, endHour: 18 },
      { dayOfWeek: 2, startHour: 8, endHour: 18 },
      { dayOfWeek: 3, startHour: 8, endHour: 18 },
      { dayOfWeek: 4, startHour: 8, endHour: 18 },
      { dayOfWeek: 5, startHour: 8, endHour: 18 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-002',
    technicianId: 'tech-ayd-002',
    location: { type: 'Point', coordinates: [82.2042, 26.7752] }, // Naya Ghat
    skills: ['pipe-leak-fix', 'tap-repair', 'bathroom-fitting'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 9, endHour: 19 },
      { dayOfWeek: 3, startHour: 9, endHour: 19 },
      { dayOfWeek: 5, startHour: 9, endHour: 19 },
      { dayOfWeek: 6, startHour: 10, endHour: 16 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-003',
    technicianId: 'tech-ayd-003',
    location: { type: 'Point', coordinates: [82.1815, 26.8019] }, // Faizabad Cantt
    skills: ['main-switch-fix', 'light-fitting', 'fan-installation', 'ac-deep-clean'],
    availabilityWindows: [
      { dayOfWeek: 0, startHour: 10, endHour: 17 },
      { dayOfWeek: 2, startHour: 8, endHour: 18 },
      { dayOfWeek: 4, startHour: 8, endHour: 18 },
      { dayOfWeek: 6, startHour: 10, endHour: 17 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-004',
    technicianId: 'tech-ayd-004',
    location: { type: 'Point', coordinates: [82.2238, 26.7905] }, // Saket College area
    skills: ['ac-deep-clean', 'ac-gas-refill'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 8, endHour: 17 },
      { dayOfWeek: 2, startHour: 8, endHour: 17 },
      { dayOfWeek: 3, startHour: 8, endHour: 17 },
      { dayOfWeek: 4, startHour: 8, endHour: 17 },
      { dayOfWeek: 5, startHour: 8, endHour: 17 },
      { dayOfWeek: 6, startHour: 9, endHour: 14 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-005',
    technicianId: 'tech-ayd-005',
    location: { type: 'Point', coordinates: [82.1652, 26.7871] }, // Reedganj
    skills: ['water-pump-repair', 'borewell-servicing'],
    availabilityWindows: [
      { dayOfWeek: 2, startHour: 9, endHour: 18 },
      { dayOfWeek: 4, startHour: 9, endHour: 18 },
      { dayOfWeek: 6, startHour: 9, endHour: 15 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-006',
    technicianId: 'tech-ayd-006',
    location: { type: 'Point', coordinates: [82.2105, 26.8084] }, // Civil Lines
    skills: ['ro-installation', 'ro-service-amc'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 8, endHour: 18 },
      { dayOfWeek: 3, startHour: 8, endHour: 18 },
      { dayOfWeek: 5, startHour: 8, endHour: 18 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-007',
    technicianId: 'tech-ayd-007',
    location: { type: 'Point', coordinates: [82.1893, 26.7681] }, // Chowk
    skills: ['main-switch-fix', 'fan-installation', 'pipe-leak-fix'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 9, endHour: 17 },
      { dayOfWeek: 2, startHour: 9, endHour: 17 },
      { dayOfWeek: 4, startHour: 9, endHour: 17 },
      { dayOfWeek: 6, startHour: 10, endHour: 15 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-008',
    technicianId: 'tech-ayd-008',
    location: { type: 'Point', coordinates: [82.2378, 26.7798] }, // Saadat Ganj
    skills: ['water-pump-repair', 'borewell-servicing', 'main-switch-fix'],
    availabilityWindows: [
      { dayOfWeek: 0, startHour: 9, endHour: 17 },
      { dayOfWeek: 3, startHour: 8, endHour: 18 },
      { dayOfWeek: 5, startHour: 8, endHour: 18 },
      { dayOfWeek: 6, startHour: 10, endHour: 16 },
    ],
    isOnline: true,
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-009',
    technicianId: 'tech-ayd-009',
    location: { type: 'Point', coordinates: [82.1748, 26.8203] }, // Nirmali Kund
    skills: ['ro-installation', 'ro-service-amc', 'tap-repair'],
    availabilityWindows: [
      { dayOfWeek: 2, startHour: 8, endHour: 17 },
      { dayOfWeek: 4, startHour: 8, endHour: 17 },
      { dayOfWeek: 6, startHour: 9, endHour: 14 },
    ],
    isOnline: false, // offline — must NOT appear in dispatch queries
    isAvailable: true,
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
  {
    id: 'tech-ayd-010',
    technicianId: 'tech-ayd-010',
    location: { type: 'Point', coordinates: [82.2151, 26.7617] }, // Bareta
    skills: ['ac-installation', 'ac-deep-clean', 'pipe-leak-fix'],
    availabilityWindows: [
      { dayOfWeek: 1, startHour: 9, endHour: 18 },
      { dayOfWeek: 3, startHour: 9, endHour: 18 },
      { dayOfWeek: 5, startHour: 9, endHour: 18 },
    ],
    isOnline: true,
    isAvailable: false, // on a job — must NOT appear in dispatch queries
    kycStatus: 'APPROVED',
    updatedAt: NOW,
  },
];

async function main(): Promise<void> {
  const client = getCosmosClient();
  const container = client.database(DB_NAME).container(CONTAINER);

  console.log(`Seeding ${TECHNICIANS.length} technicians into '${CONTAINER}'...`);
  for (const tech of TECHNICIANS) {
    await container.items.upsert(tech);
    console.log(`  ✓ ${tech.id} (${tech.location.coordinates[0]}, ${tech.location.coordinates[1]})`);
  }
  console.log('Done.');
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
