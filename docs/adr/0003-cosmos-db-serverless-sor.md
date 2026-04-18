# ADR-0003: Azure Cosmos DB Serverless as system of record (not Postgres/MySQL/Mongo Atlas)

- **Status:** accepted
- **Date:** 2026-04-17
- **Deciders:** Alok Tiwari, Winston

## Context

The product needs a primary system of record for bookings, technicians, customers, ratings, complaints, wallet ledger, audit log, catalogue, and booking events. Real-time dispatch requires geospatial queries (nearest-tech search). Owner admin needs change-feed-driven live updates. Compliance needs an append-only audit log. Free-tier compatibility is binding (NFR-M-1).

User directive: Azure Cosmos DB Serverless selected earlier.

## Decision

- **Azure Cosmos DB Serverless is primary system of record.** All entities, all relationships, all event streams.
- **Core API:** NoSQL (SQL-style) — not Mongo API, not Cassandra API, not Table API.
- **Partitioning strategy:**
  - `bookings`: partition by `customerId` (enables history queries, range by `createdAt` within partition for most reads)
  - `booking_events`: partition by `bookingId` (time-ordered event log per booking)
  - `technicians`: partition by `city` (pilot is 1 city; multi-city Phase 4 expands cleanly)
  - `customers`: partition by `customerId` (self)
  - `audit_log`: partition by `yyyy-mm` month (append-only, time-series access pattern)
  - `ratings`: partition by `bookingId`
  - `complaints`: partition by `bookingId`
  - `wallet_ledger`: partition by `technicianId`
  - `services` (catalogue): partition by `category` (small dataset, CDN-cacheable)
- **Geospatial queries** use Cosmos's native GeoJSON + spatial index (ST_WITHIN, ST_DISTANCE) for dispatch (ADR-0006).
- **Change feed** consumed by Azure Functions (change-feed trigger) for: dispatcher, live ops FCM stream, payout calculations, audit log verification.
- **Audit log append-only enforcement** via Cosmos stored-procedure policy + RBAC (admin write-once, no update/delete).

## Consequences

**Positive:**
- 25 GB + 1000 RU/s free forever. At pilot scale (5k bookings/mo) we use ~300 MB and ~20-30 RU/s peak — 98% headroom.
- Native geospatial indexing eliminates PostGIS overhead.
- Change feed is a first-class primitive, zero extra infrastructure (no Kafka, no EventBridge).
- Serverless (pay-per-request at overflow) vs provisioned means no idle cost.
- India data residency available (Azure India Central region) — DPDP compliant.
- Multi-region replication available at Phase 4 for DR.
- No schema migrations for additive changes (document model); schema changes via versioned `_v` fields.

**Negative:**
- Cross-partition queries cost more RU/s than single-partition. Discipline required in query design.
- Cosmos's RU-unit pricing model requires learning (vs raw transaction-count pricing familiar from MySQL/Postgres).
- Joins are client-side or via denormalization — different paradigm from relational.
- Fewer Indian developers familiar with it vs Postgres. Mitigated: solo founder + Claude Code team.
- Some NoSQL idioms less ergonomic than SQL (e.g., aggregations). Mitigated: Azure Synapse Link (free tier) for complex analytics in Phase 2+.

**Neutral:**
- Backup + restore: Cosmos ships with 7-day continuous backup free — meets NFR-R-2.

## Alternatives considered

- **Azure Database for PostgreSQL Flexible Server B1ms** — lowest paid tier ~₹1,800/mo. Violates ₹0 constraint. Rejected.
- **Azure SQL Serverless** — similar free tier to Cosmos but relational. Rejected because geospatial queries require spatial extensions, change feed requires CDC setup (not free-tier friendly), and partition model is less flexible.
- **Firebase Firestore** — tighter free tier (1 GB + 50k reads/day). Would exhaust faster. Real-time listeners compete with FCM. Rejected.
- **MongoDB Atlas M0** — 512 MB free forever, less generous than Cosmos. Cross-region data residency for DPDP trickier. Rejected.
- **SQLite on an Azure Files share** — toy solution; rejected.

## References

- `docs/prd.md` Data Requirements + NFR-P-1/P-2 latency targets
- `_bmad-output/planning-artifacts/architecture.md` §3.2 component responsibilities, §4.3 ADR summary, §7.2 free-tier budget
- Cosmos DB free-tier docs: 25 GB, 1000 RU/s, continuous backup 7d (as of Apr 2026)
- Innovation I-3 from `docs/brainstorm.md`
