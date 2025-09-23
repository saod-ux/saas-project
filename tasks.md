# Task Plan (From Current → Target)

Format: Goal, Acceptance, Affected, Effort, Deps

## 1) Centralize tenant resolution
- Goal: Single utility to resolve slug → tenantId; remove demo-store special-case
- Acceptance: All admin/storefront paths use `getTenantBySlug` or successor; no hardcoded IDs
- Affected: lib/firebase/tenant.ts, callers (APIs)
- Effort: M
- Deps: None

## 2) Validate admin payloads (zod or similar)
- Goal: Reject invalid slides/logo inputs with clear 400
- Acceptance: /logo and /hero/slides enforce schema; tests with invalid body return 400
- Affected: app/api/admin/[slug]/logo, hero/slides
- Effort: M
- Deps: 1

## 3) Document media flows (developer docs)
- Goal: Prevent regressions; explain write/read paths
- Acceptance: docs/media.md explaining endpoints, buckets, URL shape, cache
- Affected: docs/
- Effort: S
- Deps: None

## 4) Consistent caching policy
- Goal: Confirm dynamic/revalidate/no-store usage
- Acceptance: Inventory of pages/api with cache policy table checked-in
- Affected: docs/
- Effort: S
- Deps: None

## 5) Firestore rules review (multi-tenant)
- Goal: Ensure tenant-scoped access; no cross-tenant reads/writes from client
- Acceptance: rules draft reviewed; noted risks and required indexes
- Affected: firestore.rules (if present), docs/
- Effort: M
- Deps: None

## 6) Observability baseline
- Goal: Structured logs include tenantId, route, status
- Acceptance: API logs include fields; sample Kibana/Cloud Logs query documented
- Affected: API route handlers (logging wrapper), docs/
- Effort: M
- Deps: 1

## 7) CI checks
- Goal: Add typecheck/lint + simple API probe workflow
- Acceptance: CI runs tsc, lint, and curls key endpoints; blocks on failure
- Affected: .github/workflows/*, package.json scripts
- Effort: M
- Deps: None

## 8) Cleanup bucket drift
- Goal: Remove old e-viewstorage/appspot references
- Acceptance: repo grep shows only `e-viewstorage-public` and storage.googleapis.com
- Affected: lib/firebase/*, docs, scripts
- Effort: S
- Deps: None

## 9) Hero concurrency safety
- Goal: Avoid partial replacements under concurrent saves
- Acceptance: Transaction or version check; last-write-wins documented
- Affected: app/api/admin/[slug]/hero/slides
- Effort: M
- Deps: 2

## 10) E2E smoke for logo/hero
- Goal: Script that uploads logo, adds slide, deletes slide; verifies storefront
- Acceptance: Script exit 0 after 200s; artifacts (screenshots/logs) saved
- Affected: scripts/test-storefront.js, docs/reports/artifacts
- Effort: M
- Deps: 2,7
