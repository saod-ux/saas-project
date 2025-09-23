# Current State Report

## 1) Executive Summary
This multi-tenant e-commerce SaaS (Next.js app) supports per-tenant storefronts and an admin console. Media flows (logo and hero) are now separated with dedicated endpoints and persist correctly in Firestore; storefront reads slides by tenant and sorts in-memory. Biggest risks are: historical drift between bucket strategies, mixed tenant id/slug lookups, and caching/index pitfalls. The app is close to stable but needs standardization and guardrails.

## 2) Repository Overview
- Monorepo vs single app: Single Next.js app (app router) with API routes.
- Tech stack: Next.js 14.2.x, React/TypeScript, Tailwind, Firebase Admin (server) + Firebase client, Firestore, Google Storage.
- Scripts (package.json): dev, build, start, lint, test:*, backup/purge/dev helpers, typecheck via `test:typescript`.
- Build/Dev commands verified: `npm run dev` used; build not run in this analysis to keep scope read-only.

## 3) Runtime & Configuration
- Env files: `.env.local`, `.env`. Important keys (purpose; no secrets):
  - NEXT_PUBLIC_FIREBASE_* (client Firebase), FIREBASE_* (Admin SDK), NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET / FIREBASE_STORAGE_BUCKET (bucket selection).
- Bucket strategy:
  - Public bucket active path: `e-viewstorage-public` with direct public URLs like `https://storage.googleapis.com/<bucket>/<path>`.
  - References found: server-only and storage-server default to `e-viewstorage-public`; older references to `e-viewstorage` (signed URLs) remain in docs/examples.
- Next.js caching flags: server pages/layouts use `export const dynamic = "force-dynamic"` and `export const revalidate = 0`; fetch calls use `cache: "no-store"` in admin where needed.
- next.config: Image domain allowance for `storage.googleapis.com` is presumed present; verify on deployment.

## 4) Data Model & Tenancy
- Firestore collections (inferred):
  - `tenants/{id}`: fields include id, slug, name, logoUrl, createdAt/updatedAt.
  - `heroSlides`: fields include tenantId, type ('image'|'video'), url, isActive (default true), sortOrder (number), timestamps.
  - Various others (categories, orders, products, memberships, platform settings) exist with tenantId filtering.
- Tenant isolation: queries filter by `tenantId` for per-tenant docs; tenant resolution by slug to id via Firestore query or special-case demo-store.
- Magic constants: `demo-store` appears in utilities; ensure it doesn’t leak to other tenants.

## 5) API Surface
- Admin:
  - PUT /api/admin/[slug]/logo: upsert `tenants/{id}.logoUrl`. Inputs: { logoUrl: string|null }. Returns { ok }.
  - GET/PUT /api/admin/[slug]/hero/slides: list/replace slides for tenant. Inputs: { slides: [{ type, url, sortOrder, isActive? }] }. Returns { ok } or { ok, slides }.
  - GET/PUT /api/admin/[slug]/appearance: legacy combined endpoint; current GET normalizes logo + slides; PUT remains but logo/hero now handled by dedicated routes.
- Uploads:
  - POST /api/uploads: uploads to configured Firebase Storage; returns { ok, data: { url } }. No longer persists logo; persistence happens via /logo.
- Storefront reads:
  - Retail page server fetches `heroSlides` by tenantId and filters `isActive` then sorts in-memory by `sortOrder` (no composite index required).
- Validation/error/caching: JSON validation is minimal; endpoints return { ok: false, error } with 400/500 on invalid input; admin endpoints set `Cache-Control: no-store`.

## 6) Frontend Composition
- Storefront layout/header: Gets tenant by slug; forces fresh read of `tenants/{id}`; renders `<img src={logoUrl}>` if present; no regression to logo behavior.
- Retail hero: server-side fetch via Firestore; now uses where(tenantId)==id and sorts in memory. No composite index requirement.
- Admin → Appearance:
  - LogoUploader: uploads file via /api/uploads, then persists via PUT /api/admin/[slug]/logo.
  - HeroMediaManager: manages slides list; Save (and delete) PUTs to /api/admin/[slug]/hero/slides. Immediate persist on delete.

## 7) Media Pipeline (Logo & Hero)
- Write paths:
  - Logo: UI → /api/uploads (get URL) → PUT /api/admin/[slug]/logo → Firestore tenants/{id}.logoUrl.
  - Hero: UI → /api/uploads (get URL) → PUT /api/admin/[slug]/hero/slides (replace) → Firestore heroSlides (per item).
- Read paths:
  - Admin previews fetch appearance (normalized) and hero slides list.
  - Storefront retail page fetches slides and renders hero.
- URL format: public Google Storage URLs (`https://storage.googleapis.com/e-viewstorage-public/...`).
- Known pitfalls addressed: stale cache via dynamic/revalidate, removal of logo/hero clobbering by separating routes, avoided composite index by in-memory sort.
- Remaining edge cases: race conditions if multiple admins edit hero simultaneously; minimal input validation.

## 8) Quality & “Vibe-Coding” Hotspots
- Inconsistent patterns: mixed slug/id handling; legacy demo-store special-casing; historic endpoints left in place.
- Missing validation/types in API bodies; some broad any and silent catches in places.
- Dead/legacy code in scripts/examples referencing old buckets or signed URL approach.

## 9) Build/Type/Lint Status
- Commands (read-only context):
  - dev run observed operational; not running full `npm run build` per scope.
  - Type check/lint not executed to avoid modifying environment; recommend `npm run test:typescript` and `npm run lint` in CI.

## 10) Open Issues & Risks
- Tenant identity drift: mixing slug and id can cause mismatches if tenant creation path differs.
- Bucket drift: references to `e-viewstorage` vs `e-viewstorage-public` and `.appspot.com` variants in older code.
- Caching pitfalls: ensure all storefront reads that must be fresh remain `revalidate = 0` or `no-store` where relevant.
- IAM/permissions: public bucket assumes permissive reader access; ensure write role for service account is set.
- Validation: endpoints should validate `type` in slides and URL shape.

## 11) Verifications Performed
- Branch: stabilize/tenant-media (git branch --show-current).
- API probes executed:
  - GET /api/admin/demo-store/appearance → ok with logoUrl + heroImages.
  - PUT /api/admin/demo-store/hero/slides with 1 image → ok; GET reflects slide.
- Grep for bucket/slug references confirmed active usage of `e-viewstorage-public` and historic references.
- Retail hero query confirmed no composite index (sorting in memory after single where).

## 12) Recommendations
- Stabilize media flows in code comments and docs; deprecate legacy `/appearance` writes in favor of /logo and /hero/slides.
- Centralize tenant resolution (slug→id) and remove demo-store special-case.
- Add request validation and zod schemas for admin endpoints.
- Add CI steps: typecheck, lint, and minimal e2e probes for logo/hero flows.
- Create Firestore security rules review for multi-tenant isolation.
