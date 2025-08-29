-- Enable Row-Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant_id from session
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
END;
$$ LANGUAGE plpgsql;

-- Create function to set tenant_id in session (LOCAL scope for transaction isolation)
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Use LOCAL scope so it's scoped to the current transaction
  PERFORM set_config('app.tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for tenants (only allow access to own tenant)
CREATE POLICY "tenants_tenant_isolation" ON tenants
  FOR ALL USING (id = get_tenant_id()::TEXT);

-- RLS Policies for users (allow access to all users for now, will be restricted by membership in Phase 2)
CREATE POLICY "users_allow_all" ON users
  FOR ALL USING (true);

-- RLS Policies for memberships (only allow access to memberships for current tenant)
CREATE POLICY "memberships_tenant_isolation" ON memberships
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);

-- RLS Policies for products (only allow access to products for current tenant)
CREATE POLICY "products_tenant_isolation" ON products
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);

-- RLS Policies for product_images (only allow access to images for current tenant's products)
CREATE POLICY "product_images_tenant_isolation" ON product_images
  FOR ALL USING (
    "productId" IN (
      SELECT id FROM products WHERE "tenantId" = get_tenant_id()::TEXT
    )
  );

-- RLS Policies for orders (only allow access to orders for current tenant)
CREATE POLICY "orders_tenant_isolation" ON orders
  FOR ALL USING ("tenantId" = get_tenant_id()::TEXT);
