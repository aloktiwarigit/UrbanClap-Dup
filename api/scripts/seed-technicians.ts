#!/usr/bin/env tsx
// Seed 10 test technicians spread across Bengaluru.
// Run: pnpm seed:technicians
// Requires: COSMOS_ENDPOINT and COSMOS_KEY env vars.

import { getCosmosClient, DB_NAME } from '../src/cosmos/client.js';
import type { TechnicianProfile } from '../src/schemas/technician.js';

const NOW = new Date().toISOString();
const CONTAINER = 'technicians';

const TECHNICIANS: TechnicianProfile[] = [
  {
    id: 'tech-blr-001',
    technicianId: 'tech-blr-001',
    location: { type: 'Point', coordinates: [77.6245, 12.9352] }, // Koramangala
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
    id: 'tech-blr-002',
    technicianId: 'tech-blr-002',
    location: { type: 'Point', coordinates: [77.6408, 12.9784] }, // Indiranagar
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
    id: 'tech-blr-003',
    technicianId: 'tech-blr-003',
    location: { type: 'Point', coordinates: [77.7500, 12.9698] }, // Whitefield
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
    id: 'tech-blr-004',
    technicianId: 'tech-blr-004',
    location: { type: 'Point', coordinates: [77.6474, 12.9116] }, // HSR Layout
    skills: ['deep-clean-1bhk', 'deep-clean-2bhk'],
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
    id: 'tech-blr-005',
    technicianId: 'tech-blr-005',
    location: { type: 'Point', coordinates: [77.7011, 12.9591] }, // Marathahalli
    skills: ['cockroach-treatment', 'bed-bug-treatment', 'general-pest-control'],
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
    id: 'tech-blr-006',
    technicianId: 'tech-blr-006',
    location: { type: 'Point', coordinates: [77.5830, 12.9299] }, // Jayanagar
    skills: ['pipe-leak-fix', 'main-switch-fix', 'light-fitting'],
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
    id: 'tech-blr-007',
    technicianId: 'tech-blr-007',
    location: { type: 'Point', coordinates: [77.6101, 12.9166] }, // BTM Layout
    skills: ['deep-clean-2bhk', 'deep-clean-3bhk', 'deep-clean-1bhk'],
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
    id: 'tech-blr-008',
    technicianId: 'tech-blr-008',
    location: { type: 'Point', coordinates: [77.6790, 12.8399] }, // Electronic City
    skills: ['ac-deep-clean', 'cockroach-treatment', 'general-pest-control'],
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
    id: 'tech-blr-009',
    technicianId: 'tech-blr-009',
    location: { type: 'Point', coordinates: [77.5963, 13.1007] }, // Yelahanka
    skills: ['tap-repair', 'bathroom-fitting', 'pipe-leak-fix'],
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
    id: 'tech-blr-010',
    technicianId: 'tech-blr-010',
    location: { type: 'Point', coordinates: [77.5468, 12.9255] }, // Banashankari
    skills: ['fan-installation', 'main-switch-fix', 'ac-gas-refill'],
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
