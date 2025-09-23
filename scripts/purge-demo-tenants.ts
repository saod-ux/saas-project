// scripts/purge-demo-tenants.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";

const DRY = process.env.CONFIRM_PURGE !== "YES";
const ALLOWED_PREFIXES = ["demo", "acme", "moka", "seed", "sample", "test", "play", "sandbox"];

function isProd() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  );
}

function matchSlug(slug: string) {
  const s = (slug || "").toLowerCase();
  return ALLOWED_PREFIXES.some(p => 
    s === p || 
    s.startsWith(`${p}-`) || 
    s.startsWith(`${p}_`) || 
    s.startsWith(p)
  );
}

async function main() {
  console.log("🧹 Demo Tenant Purge Script");
  console.log("==========================");
  
  if (isProd()) {
    console.error("❌ Refusing to run in production environment.");
    console.error("   NODE_ENV:", process.env.NODE_ENV);
    console.error("   VERCEL_ENV:", process.env.VERCEL_ENV);
    console.error("   NEXT_PUBLIC_VERCEL_ENV:", process.env.NEXT_PUBLIC_VERCEL_ENV);
    process.exit(1);
  }

  console.log("✅ Environment check passed - running in development mode");
  console.log(`🔍 Mode: ${DRY ? "DRY RUN (no changes)" : "LIVE DELETE"}`);
  console.log("");

  // 1) Find candidate tenants by slug
  console.log("📋 Scanning for demo/mock tenants...");
  const tenants = await prisma.tenant.findMany({
    select: { 
      id: true, 
      slug: true, 
      name: true, 
      createdAt: true,
      status: true
    },
    orderBy: { createdAt: "desc" }
  });

  const targets = tenants.filter(t => matchSlug(t.slug));
  
  if (!targets.length) {
    console.log("✅ No demo/mock tenants found to purge.");
    console.log(`   Scanned ${tenants.length} total tenants`);
    return;
  }

  console.log(`🎯 Found ${targets.length} demo/mock tenants to purge:`);
  targets.forEach(t => {
    console.log(`   - ${t.slug} (${t.name}) - ${t.status} - Created: ${t.createdAt.toISOString().split('T')[0]}`);
  });

  console.log("");
  console.log(`📊 Total tenants in database: ${tenants.length}`);
  console.log(`🗑️  Tenants to delete: ${targets.length}`);
  console.log(`✅ Tenants to keep: ${tenants.length - targets.length}`);

  if (DRY) {
    console.log("");
    console.log("🔍 DRY RUN COMPLETE - No data was deleted");
    console.log("   To actually delete, run: CONFIRM_PURGE=YES npm run purge:demo");
    return;
  }

  console.log("");
  console.log("⚠️  LIVE DELETE MODE - This will permanently delete data!");
  console.log("   Proceeding with deletion in 3 seconds...");
  
  // Small delay to allow user to cancel if needed
  await new Promise(resolve => setTimeout(resolve, 3000));

  const ids = targets.map(t => t.id);

  // 2) Delete in transaction (child tables first -> tenants last)
  console.log("");
  console.log("🗑️  Starting deletion process...");
  
  await prisma.$transaction(async (tx) => {
    const safe = async (label: string, fn: () => Promise<any>) => {
      try { 
        const r = await fn(); 
        console.log(`   ✅ ${label} deleted`); 
        return r; 
      }
      catch (e: any) { 
        console.log(`   ⚠️  ${label} skipped (${e?.code || e?.message || e})`); 
      }
    };

    // Domains
    await safe("domains", () => tx.domains.deleteMany({ where: { tenantId: { in: ids }}}));

    // Memberships / roles
    await safe("memberships", () => tx.memberships.deleteMany({ where: { tenantId: { in: ids }}}));

    // Content/pages
    await safe("pages", () => tx.pages.deleteMany({ where: { tenantId: { in: ids }}}));

    // Hero slides / media mappings
    await safe("hero_slides", () => tx.hero_slides.deleteMany({ where: { tenantId: { in: ids }}}));

    // Products & related
    await safe("product_images", () => tx.product_images.deleteMany({ where: { product: { tenantId: { in: ids }}}}));
    await safe("products", () => tx.products.deleteMany({ where: { tenantId: { in: ids }}}));

    // Categories
    await safe("categories", () => tx.categories.deleteMany({ where: { tenantId: { in: ids }}}));

    // Orders / carts if exist
    await safe("order_items", () => tx.order_items.deleteMany({ where: { order: { tenantId: { in: ids }}}}));
    await safe("orders", () => tx.orders.deleteMany({ where: { tenantId: { in: ids }}}));
    await safe("cart_items", () => tx.cart_items.deleteMany({ where: { cart: { tenantId: { in: ids }}}}));
    await safe("carts", () => tx.carts.deleteMany({ where: { tenantId: { in: ids }}}));

    // Finally: tenants
    await safe("tenants", () => tx.tenant.deleteMany({ where: { id: { in: ids }}}));
  });

  console.log("");
  console.log("✅ Purge complete!");
  console.log(`   Deleted ${targets.length} demo/mock tenants and all related data`);
  console.log("");
  console.log("🎉 You can now:");
  console.log("   - Create a new tenant from Platform Admin → Merchants");
  console.log("   - Test the complete merchant onboarding flow");
  console.log("   - Add custom domains and verify the setup");
}

main().then(() => {
  console.log("");
  console.log("🏁 Script completed successfully");
  process.exit(0);
}).catch(e => {
  console.error("");
  console.error("❌ Script failed with error:");
  console.error(e);
  process.exit(1);
});
