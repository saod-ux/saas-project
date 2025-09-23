#!/bin/bash

# i18n Translation Key Checker
# This script ensures all translation keys used in code exist in message files

set -e

echo "🔍 Checking i18n translation keys..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required files exist
if [ ! -f "messages/en.json" ] || [ ! -f "messages/ar.json" ]; then
  echo -e "${RED}❌ Missing message files! Please ensure messages/en.json and messages/ar.json exist${NC}"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}❌ jq is required but not installed. Please install jq to continue.${NC}"
  echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
  exit 1
fi

# Find all translation keys used in code (exclude build artifacts and non-UI files)
echo "📖 Extracting translation keys from UI components..."
USED_KEYS=$(grep -r "t(['\"\`][^'\"]*['\"\`])" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=build \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=app/api \
  --exclude-dir=lib \
  --exclude-dir=prisma \
  --exclude-dir=scripts \
  --exclude-dir=messages \
  --exclude="messages/*.json" \
  . | \
  sed -n "s/.*t(['\"\`]\([^'\"]*\)['\"\`]).*/\1/p" | \
  sort -u | grep -v "^$" | grep -v "^[^a-zA-Z]" | grep -v "^[a-zA-Z]*$" | \
  grep -v "^content-type$" | grep -v "^x-knet-signature$" | grep -v "^x-myfatoorah-signature$" | grep -v "^x-tenant-slug$" || true)

if [ -z "$USED_KEYS" ]; then
  echo -e "${GREEN}✅ No translation keys found in code${NC}"
  exit 0
fi

echo "Found translation keys:"
echo "$USED_KEYS" | sed 's/^/  - /'
echo ""

echo "🔍 Checking for hard-coded strings that should use t()..."
HARDCODED_STRINGS=$(grep -r '"[A-Z][^"{<]{4,}"' \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=build \
  --exclude-dir=dist \
  --exclude-dir=.git \
  --exclude-dir=app/api \
  --exclude-dir=lib \
  --exclude-dir=prisma \
  --exclude-dir=scripts \
  --exclude-dir=messages \
  . | \
  grep -v 't(' | \
  grep -v 'console.log' | \
  grep -v 'console.error' | \
  sed -n 's/.*"\([A-Z][^"]*\)".*/\1/p' | \
  sort -u | head -20 || true)

if [ -n "$HARDCODED_STRINGS" ]; then
  echo "⚠️  Found potential hard-coded strings that should use t():"
  echo "$HARDCODED_STRINGS" | sed 's/^/  /'
  echo ""
fi

# Function to check if a nested key exists in JSON
check_key_exists() {
  local key="$1"
  local file="$2"
  local path=$(echo "$key" | sed 's/\./","/g' | sed 's/^/"/' | sed 's/$/"/')
  
  if echo "$path" | grep -q '","'; then
    # Multi-level key
    jq -e "getpath([$path]) != null" "$file" > /dev/null 2>&1
  else
    # Single level key
    jq -e "has(\"$key\")" "$file" > /dev/null 2>&1
  fi
}

# Check if keys exist in English messages
echo "🇺🇸 Checking English translations..."
MISSING_EN=()
while IFS= read -r key; do
  if [ -n "$key" ] && ! check_key_exists "$key" "messages/en.json"; then
    MISSING_EN+=("$key")
  fi
done <<< "$USED_KEYS"

# Check if keys exist in Arabic messages  
echo "🇰🇼 Checking Arabic translations..."
MISSING_AR=()
while IFS= read -r key; do
  if [ -n "$key" ] && ! check_key_exists "$key" "messages/ar.json"; then
    MISSING_AR+=("$key")
  fi
done <<< "$USED_KEYS"

# Report results
if [ ${#MISSING_EN[@]} -eq 0 ] && [ ${#MISSING_AR[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All translation keys are present in both message files!${NC}"
  exit 0
else
  echo -e "${RED}❌ Missing translation keys found:${NC}"
  
  if [ ${#MISSING_EN[@]} -gt 0 ]; then
    echo -e "${YELLOW}🇺🇸 Missing in English (messages/en.json):${NC}"
    for key in "${MISSING_EN[@]}"; do
      echo "  - $key"
    done
  fi
  
  if [ ${#MISSING_AR[@]} -gt 0 ]; then
    echo -e "${YELLOW}🇰🇼 Missing in Arabic (messages/ar.json):${NC}"
    for key in "${MISSING_AR[@]}"; do
      echo "  - $key"
    done
  fi
  
  echo -e "${RED}💥 Build failed due to missing translation keys!${NC}"
  exit 1
fi
