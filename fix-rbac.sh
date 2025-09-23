#!/bin/bash

# Find all files with user.tenantId and fix them
files=$(find app/api -name "*.ts" -exec grep -l "user\.tenantId" {} \;)

for file in $files; do
  echo "Fixing $file"
  
  # Replace the requireTenantAndRole pattern
  sed -i '' 's/const user = await requireTenantAndRole(request, params\.tenantSlug, \[\([^]]*\)\])/const result = await requireTenantAndRole(request, params.tenantSlug, [\1])\n    if (result instanceof NextResponse) return result\n    \n    const { tenant } = result/g' "$file"
  
  # Replace user.tenantId with tenant.id
  sed -i '' 's/user\.tenantId/tenant.id/g' "$file"
done

echo "Fixed all files"

