# E03-S01 — Service Catalogue: Data Model, API & Admin CRUD

**Date:** 2026-04-19
**Story:** E03-S01
**Status:** Approved — ready for implementation planning
**Dependencies:** E01-S01 (API skeleton), E01-S06 (OpenAPI codegen), E02-S04 (admin auth — stub until merged)
**Downstream consumers:** E03-S02 (catalogue UI), E05-S02 (dispatch reads commissionBps), E06-S02 (reads photoStages), E06-S04 (Razorpay Route uses commissionBps), E09-S05 (audit log via updatedBy)

---

## 1. Data Model

### `service_categories` — Cosmos collection
Partition key: `/id` | TTL index enabled (value: -1, never expires — enables Phase 2 time-limited promotional categories without schema migration)

| Field | Type | Notes |
|---|---|---|
| `id` | string | **Immutable** slug e.g. `"ac-repair"`. Never changes after creation. |
| `name` | string | Mutable display name e.g. `"AC Repair"` |
| `heroImageUrl` | string | Firebase Storage CDN URL |
| `sortOrder` | number | Home screen display order (ascending) |
| `isActive` | boolean | Soft delete — never hard-delete (bookings reference categoryId) |
| `updatedBy` | string | Firebase UID of last admin editor (lightweight audit until E09-S05) |
| `createdAt` | string | ISO8601 UTC |
| `updatedAt` | string | ISO8601 UTC |

### `services` — Cosmos collection
Partition key: `/categoryId` — co-locates all services in a category for efficient home screen query.

| Field | Type | Notes |
|---|---|---|
| `id` | string | **Immutable** slug e.g. `"ac-deep-clean"` |
| `categoryId` | string | FK → `service_categories.id` |
| `name` | string | e.g. `"AC Deep Clean"` |
| `shortDescription` | string | 1-sentence card tagline for home screen card |
| `heroImageUrl` | string | Firebase Storage CDN URL |
| `basePrice` | number | **Paise** (integer). ₹599 = 59900. Avoids float rounding for Razorpay. |
| `commissionBps` | number | Basis points. 2250 = 22.5%. Used by E06-S04 Razorpay Route split. |
| `durationMinutes` | number | Estimated service duration shown on detail + job offer card |
| `includes` | string[] | Detail screen checklist bullets |
| `faq` | `{ question: string; answer: string }[]` | FAQ accordion on detail screen |
| `addOns` | `{ id: string; name: string; price: number; triggerCondition: string }[]` | Embedded. Price in paise. Trigger shown on detail screen. |
| `photoStages` | `{ id: string; label: string; required: boolean }[]` | Consumed by E06-S02 guided photo capture. e.g. `[{ id: "before", label: "Unit before service", required: true }]` |
| `isActive` | boolean | Soft delete only |
| `updatedBy` | string | Firebase UID |
| `createdAt` | string | ISO8601 UTC |
| `updatedAt` | string | ISO8601 UTC |

**Invariants:**
- `id` is immutable post-creation on both collections.
- No hard deletes — `isActive: false` is the only removal mechanism.
- `basePrice` and `addOns[].price` are always integers in paise.
- `commissionBps` range: 1500–3500 (15%–35%). Validated by Zod.

---

## 2. API Endpoints

### Public (unauthenticated)
Both endpoints return `Cache-Control: public, max-age=300, stale-while-revalidate=60`.

#### `GET /v1/categories`
Returns all `isActive: true` categories with their `isActive: true` services nested.
Single Cosmos cross-partition query — one HTTP round trip for the home screen.
Services in this response are **card-shape** (no `includes`, `faq`, `addOns`, `photoStages`).

Response:
```json
{
  "categories": [
    {
      "id": "ac-repair",
      "name": "AC Repair",
      "heroImageUrl": "https://firebasestorage.googleapis.com/...",
      "sortOrder": 1,
      "services": [
        {
          "id": "ac-deep-clean",
          "name": "AC Deep Clean",
          "shortDescription": "Chemical wash, gas check, filter clean — fully covered.",
          "heroImageUrl": "https://firebasestorage.googleapis.com/...",
          "basePrice": 59900,
          "durationMinutes": 90
        }
      ]
    }
  ]
}
```

#### `GET /v1/services/{id}`
Full service detail. Includes `includes`, `faq`, `addOns`, `photoStages`.
Used by: service detail screen, booking confirmation screen (E03-S03), job offer card (E05-S03).

Response: full `services` document shape minus `updatedBy`, `createdAt`, `updatedAt`, `commissionBps` (internal fields stripped at API layer).

---

### Admin (`/v1/admin/catalogue/*`)

Auth: `requireAdminAuth` middleware — passes in `NODE_ENV=development` (logs warning); returns `401` in `NODE_ENV=production`. E02-S04 replaces this stub with Firebase JWT + role-claim verification. No changes to route handlers required.

All admin write responses include the full updated document. All writes set `updatedAt = now()` and `updatedBy = callerUid`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/admin/catalogue/categories` | Create category |
| `PUT` | `/v1/admin/catalogue/categories/{id}` | Full update (all mutable fields) |
| `PATCH` | `/v1/admin/catalogue/categories/{id}/toggle` | Flip `isActive` |
| `GET` | `/v1/admin/catalogue/services?categoryId=` | List services incl. inactive |
| `POST` | `/v1/admin/catalogue/services` | Create service |
| `PUT` | `/v1/admin/catalogue/services/{id}` | Full update |
| `PATCH` | `/v1/admin/catalogue/services/{id}/toggle` | Flip `isActive` |

Error responses: `400` (Zod parse fail — body includes field-level errors), `404` (document not found), `409` (duplicate `id` on create).

---

## 3. Auth Middleware Stub

```typescript
// api/src/middleware/require-admin-auth.ts
export function requireAdminAuth(req, ctx): { uid: string; role: string } | never {
  if (process.env.NODE_ENV !== 'production') {
    ctx.warn('requireAdminAuth: bypassed in dev mode');
    return { uid: 'dev-user', role: 'super-admin' };
  }
  // Returns 401 until E02-S04 wires real Firebase JWT verification
  throw new HttpError(401, 'Admin auth not yet configured');
}
```

---

## 4. Caching Strategy

- Public endpoints: `Cache-Control: public, max-age=300, stale-while-revalidate=60`
- Admin read/write endpoints: `Cache-Control: no-store`
- No CDN invalidation logic needed at pilot scale — 5-minute staleness acceptable for catalogue changes.

---

## 5. Seed Data

Idempotent upsert script: `api/src/infra/cosmos/seeds/catalogue.ts`
Run via: `npm run seed:catalogue`
Uses Cosmos `upsert` — safe to run multiple times (CI, local dev, staging).

| Category | Services | Base Price (₹) |
|---|---|---|
| AC Repair | Deep Clean, Gas Refill, Installation | 599 / 1,499 / 2,999 |
| Deep Cleaning | 1BHK, 2BHK, 3BHK | 1,299 / 1,799 / 2,299 |
| Plumbing | Leak Fix, Tap Install, Pipe Repair | 399 / 599 / 799 |
| Electrical | Fan Install, Switchboard Fix, Wiring | 299 / 399 / 999 |
| Pest Control | Cockroach, Bed Bugs, Full Home | 599 / 1,499 / 2,499 |

All services seeded with `commissionBps: 2250` (22.5%), representative `photoStages`, and 2–3 `addOns`.

---

## 6. Testing Strategy

| Layer | Scope | Tool |
|---|---|---|
| Unit | Zod schema parse/reject, paise validation, commissionBps range | Vitest |
| Integration | Cosmos CRUD — create, read, update, toggle via emulator | Testcontainers + Cosmos emulator |
| Contract | `GET /v1/categories` + `GET /v1/services/{id}` response shapes match OpenAPI spec | openapi-fetch type inference + Vitest |
| Admin CRUD | Happy path + 400 / 404 / 409 for each endpoint | Vitest integration |
| Auth stub | Admin routes return 401 in `NODE_ENV=production` | Vitest |
| Seed | Idempotency — run twice, assert same document count and field values | Vitest |
| Public filter | `isActive: false` documents not returned in public endpoints | Vitest integration |

Coverage gate: ≥80% line coverage (existing CI Vitest requirement).

---

## 7. File Structure

```
api/src/
  functions/
    catalogue-public.ts        GET /v1/categories, GET /v1/services/{id}
    catalogue-admin.ts         all /v1/admin/catalogue/* routes
  schemas/
    service-category.ts        Zod schemas + openapi() extensions
    service.ts                 Zod schemas + openapi() extensions
  infra/
    cosmos/
      catalogue-repository.ts  all Cosmos reads/writes (repository pattern)
      seeds/
        catalogue.ts           idempotent upsert seed with full 5×3-5 data
  middleware/
    require-admin-auth.ts      stub (replaced by E02-S04)
  openapi/
    registry.ts                extend existing registry with new paths → triggers codegen

admin-web/src/
  app/
    catalogue/
      page.tsx                 categories list + toggle controls
      [categoryId]/
        page.tsx               services list for category
        services/
          new/page.tsx         create service form
          [serviceId]/
            page.tsx           edit service form
  components/
    catalogue/
      CategoryCard.tsx         reusable category row
      ServiceForm.tsx          create/edit form with all fields
```

---

## 8. OpenAPI Integration

New paths registered in `api/src/openapi/registry.ts`:
- `GET /v1/categories` → `CatalogueListResponse`
- `GET /v1/services/{id}` → `ServiceDetailResponse`
- All `/v1/admin/catalogue/*` paths with request/response schemas

On next `npm run generate:api` in `admin-web/`, the typed client gains `getCategories()`, `getServicesById()`, and all admin catalogue methods automatically (E01-S06 codegen pipeline).

---

## 9. Integration Checklist (downstream stories)

| Story | What E03-S01 provides |
|---|---|
| E03-S02 | `GET /v1/categories` nested response for home screen; `GET /v1/services/{id}` for detail |
| E03-S03 | `basePrice` locked at booking creation time (snapshot into booking document) |
| E05-S02 | Dispatcher reads service `categoryId` for tech skill matching |
| E06-S02 | `photoStages[]` drives guided photo capture flow |
| E06-S04 | `commissionBps` used to calculate Razorpay Route tech payout |
| E09-S03 | Admin override audit uses `updatedBy` field pattern |
| E09-S05 | Audit log writes on every admin catalogue edit |
