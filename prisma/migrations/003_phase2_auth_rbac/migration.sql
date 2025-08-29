-- Phase 2: Enable RLS on new tables
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies to use new schema
DROP POLICY IF EXISTS "memberships_tenant_isolation" ON memberships;
CREATE POLICY "memberships_tenant_isolation" ON memberships
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);

-- RLS Policies for invites (only allow access to invites for current tenant)
CREATE POLICY "invites_tenant_isolation" ON invites
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);

-- RLS Policies for files (only allow access to files for current tenant)
CREATE POLICY "files_tenant_isolation" ON files
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);

-- Update product_images policy to use new fileId relationship
DROP POLICY IF EXISTS "product_images_tenant_isolation" ON product_images;
CREATE POLICY "product_images_tenant_isolation" ON product_images
  FOR ALL USING (
    "productId" IN (
      SELECT id FROM products WHERE "tenantId" = get_tenant_id()::TEXT
    )
  );
