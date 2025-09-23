# Analysis Tracking

## Entry - stabilize/tenant-media
- Timestamp: 2025-09-23T00:00:00Z (replace with actual local time)
- Branch: stabilize/tenant-media
- Commands executed (read-only):
  - git branch --show-current
  - grep -RIn "e-viewstorage|e-viewstorage-public|appspot.com|storage.googleapis.com|demo-store" .
  - node -v && npm -v
  - jq -r '.scripts' package.json
  - find app -maxdepth 4 -type f -name "page.tsx" -o -name "route.ts"
- Key findings:
  - Public bucket flow is active (`e-viewstorage-public`), URLs are storage.googleapis.com.
  - Media endpoints are separated: /logo and /hero/slides; legacy /appearance remains for GET/compat.
  - Storefront hero sorts in-memory to avoid composite index.
  - Tenant resolution uses Firestore; demo-store special-casing exists.
- Artifacts:
  - docs/reports/current-state.md
  - docs/reports/artifacts/README.md

## Entry - planning docs
- Timestamp: 2025-09-23T00:00:00Z (replace with actual local time)
- Generated:
  - architecture.md (target architecture aligned with current stack)
  - tasks.md (granular plan to stabilize and finish media flows)
- Why: stabilize & finish multi-tenant media flows without rewrites; keep app deployable each step
- Assumptions: continue using `e-viewstorage-public`; tenant isolation by `tenantId`; no schema migration needed immediately
- Next immediate task: Centralize tenant resolution (slug→id) and remove demo-store special-case

## Entry - T-001 Centralize tenant resolution
- Timestamp: 2025-09-23T00:00:00Z (replace with actual local time)
- Scope: Remove demo-store hardcode; unify slug→tenantId via Firestore
- Changes: lib/firebase/tenant.ts (removed special-case; single query path)
- Tests: Dev server previously validated tenant flows; no API shape changes introduced
- Risks: If some environment relies on hardcoded demo ID, it must have a tenant doc with slug present
- Env vars referenced: FIREBASE_* (Admin), NEXT_PUBLIC_FIREBASE_* (client)

## Entry - T-002 Enforce logo/hero sources of truth
- Timestamp: 2025-09-23T00:00:00Z (replace with actual local time)
- Scope: Ensure `tenants/{id}.logoUrl` and `heroSlides` are the only sources of truth
- Changes: app/api/uploads/route.ts no longer persists logo; it only uploads and returns URL
- Tests: Upload still returns URL; Logo persistence handled via PUT /api/admin/[slug]/logo; hero via PUT /api/admin/[slug]/hero/slides
- Risks: Existing clients sending `asLogo` to /api/uploads will no-op persistence; they must call /logo explicitly
- Env vars referenced: FIREBASE_STORAGE_BUCKET / NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET