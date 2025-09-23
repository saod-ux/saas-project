# Target Architecture (Aligned with Current Codebase)

## Goals
- Stabilize multi-tenant SaaS without rewrites; keep Next.js + Firestore + GCS.
- Strict tenant isolation across UI, API, and data access.
- Clear media flows: separate logo vs hero; predictable caching.

## Overview
- App: Next.js 14 (App Router, SSR/ISR disabled where freshness required)
- Auth: Firebase Auth (customer side); Admin auth (existing mechanisms)
- Data: Firestore (tenants, heroSlides, categories, orders, products)
- Storage: Google Cloud Storage (public bucket `e-viewstorage-public`)
- Cache: `dynamic = "force-dynamic"`, `revalidate = 0`, `cache: "no-store"` for admin/critical reads

```
+----------------------------+         +-----------------------------+
|     Browser (Tenant UI)    | <-----> |     Next.js Server (SSR)    |
|  LTR/RTL, Header, Hero     |         |  API Routes, Server Fetch   |
+----------------------------+         +-----------------------------+
               |                                     |
               v                                     v
      +----------------+                   +---------------------+
      |  Firestore     | <---------------> |  Firebase Admin SDK |
      |  tenants, ...  |                   |  (server only)      |
      +----------------+                   +---------------------+
               ^                                     |
               |                                     v
         +-----------+                     +------------------+
         |   GCS     |  public URLs ---->  |  Storefront HTML |
         |  Bucket   |                     |  <img src=...>   |
         +-----------+                     +------------------+
```

## Core Services
- Server Rendering & APIs (Next.js): tenant resolution, validated admin writes, storefront reads
- Firestore (data): per-tenant collections filtered by `tenantId`
- GCS (media): public read, service account write

## APIs
- Admin media:
  - PUT /api/admin/[slug]/logo → upsert `tenants/{id}.logoUrl`
  - GET/PUT /api/admin/[slug]/hero/slides → replace/read heroSlides
- Legacy:
  - GET/PUT /api/admin/[slug]/appearance (read-normalization; avoid writes going forward)
- Uploads:
  - POST /api/uploads → returns public URL; no persistence side-effects

## Auth & Tenant Isolation
- Admin side: authorize before writes; resolve `[slug]` → `tenantId`; every write tagged with `tenantId`
- Storefront: resolve tenant by slug; read only `tenantId`-scoped docs

## Data Layer
- Firestore doc shapes (subset):
  - tenants/{id}: { slug, name, logoUrl, createdAt, updatedAt }
  - heroSlides: { tenantId, type: 'image'|'video', url, isActive: true, sortOrder: number, createdAt, updatedAt }

## Storage
- Bucket: `e-viewstorage-public` (public read). URLs: `https://storage.googleapis.com/<bucket>/<path>`
- Write via Admin SDK; delete/update via API endpoints

## Observability
- Logs: API success/error JSON; add structured logs (level, tenantId, route)
- Metrics (later): counts per route, error rates; basic health endpoints exist

## CI/CD
- CI: typecheck (`npx tsc --noEmit`), lint (`next lint`), minimal probes (curl endpoints) per PR
- CD: deploy on main; branch protection; environment secrets for Firebase Admin

## Rationale
- Keeps current stack; isolates risky areas (media, tenant resolution) with small, testable endpoints
- Public bucket simplifies delivery and avoids signed URL churn

## Small Diagrams

Tenant Resolution & Read
```
[Storefront Request /{slug}/retail]
   -> getTenantBySlug(slug) -> tenant.id
   -> Firestore heroSlides where tenantId==id
   -> sort in memory (sortOrder)
   -> render hero + logo
```

Admin Media Write
```
[Admin] LogoUploader -> /api/uploads -> URL
[Admin] -> PUT /api/admin/{slug}/logo { logoUrl }
   -> resolve tenantId -> set tenants/{id}.logoUrl

[Admin] HeroMedia -> PUT /api/admin/{slug}/hero/slides { slides[] }
   -> resolve tenantId -> delete existing, create new sorted slides
```
