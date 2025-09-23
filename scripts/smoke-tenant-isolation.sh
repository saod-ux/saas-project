#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3000"}

if [ $# -lt 2 ]; then
  echo "Usage: BASE_URL=... $0 <tenantA> <tenantB>" >&2
  exit 1
fi

TENANT_A="$1"
TENANT_B="$2"

echo "🔎 Tenant isolation smoke: $TENANT_A vs $TENANT_B (BASE_URL=$BASE_URL)"

echo "→ GET appearance (A)"
JSON_A=$(curl -sS "$BASE_URL/api/admin/$TENANT_A/appearance")
LOGO_A=$(echo "$JSON_A" | jq -r '.appearance.logoUrl // ""')
HERO_A=$(echo "$JSON_A" | jq -r '.appearance.heroImages[0] // ""')
echo "   logoA=$LOGO_A"
echo "   heroA=$HERO_A"

echo "→ GET appearance (B)"
JSON_B=$(curl -sS "$BASE_URL/api/admin/$TENANT_B/appearance")
LOGO_B=$(echo "$JSON_B" | jq -r '.appearance.logoUrl // ""')
HERO_B=$(echo "$JSON_B" | jq -r '.appearance.heroImages[0] // ""')
echo "   logoB=$LOGO_B"
echo "   heroB=$HERO_B"

STATUS=0
if [ "$TENANT_A" = "$TENANT_B" ]; then
  echo "❌ Tenants must be different" >&2
  exit 2
fi

echo "→ Fetch storefront HTML (A retail)"
HTML_A=$(curl -sS "$BASE_URL/$TENANT_A/retail" || true)
echo "$HTML_A" >/dev/null

echo "→ Fetch storefront HTML (B retail)"
HTML_B=$(curl -sS "$BASE_URL/$TENANT_B/retail" || true)
echo "$HTML_B" >/dev/null

echo "✅ Completed smoke. Compare values above to ensure no cross-tenant leakage."
exit $STATUS


