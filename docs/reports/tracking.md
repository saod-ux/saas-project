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
