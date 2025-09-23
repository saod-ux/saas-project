// scripts/purge-demo-storage.ts
import "dotenv/config";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, getApps, cert } from "firebase-admin/app";

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

async function purgeFolder(prefix: string) {
  console.log(`   📁 Scanning folder: ${prefix}`);
  
  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    
    const [files] = await bucket.getFiles({
      prefix: prefix,
      maxResults: 1000
    });
    
    if (!files.length) {
      console.log(`   ✅ No files found in ${prefix}`);
      return;
    }
    
    const paths = files.map(f => f.name);
    
    if (DRY) {
      console.log(`   🔍 [DRY] Would remove ${paths.length} files from ${prefix}`);
      paths.forEach(path => console.log(`      - ${path}`));
      return;
    }
    
    await bucket.deleteFiles({
      prefix: prefix
    });
    
    console.log(`   ✅ Removed ${paths.length} files from ${prefix}`);
    
  } catch (error: any) {
    console.log(`   ❌ Exception in ${prefix}: ${error.message}`);
  }
}

async function main() {
  console.log("🗂️  Demo Storage Purge Script (Firebase Storage)");
  console.log("================================================");
  
  if (isProd()) {
    console.error("❌ Refusing to run in production environment.");
    process.exit(1);
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error("❌ Missing Firebase environment variables:");
    console.error("   FIREBASE_PROJECT_ID:", !!process.env.FIREBASE_PROJECT_ID);
    console.error("   FIREBASE_PRIVATE_KEY:", !!process.env.FIREBASE_PRIVATE_KEY);
    process.exit(1);
  }

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  console.log("✅ Environment check passed - running in development mode");
  console.log(`🔍 Mode: ${DRY ? "DRY RUN (no changes)" : "LIVE DELETE"}`);
  console.log(`📦 Bucket: ${process.env.FIREBASE_STORAGE_BUCKET}`);
  console.log("");

  // Get list of demo tenant slugs from Firestore
  console.log("📋 Getting demo tenant slugs from Firestore...");
  
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    
    const tenantsSnapshot = await db.collection('tenants').get();
    const tenants = tenantsSnapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));

    const demoSlugs = tenants
      .filter(t => matchSlug(t.slug))
      .map(t => t.slug);

    if (!demoSlugs.length) {
      console.log("✅ No demo tenant storage folders found to purge.");
      return;
    }

    console.log(`🎯 Found ${demoSlugs.length} demo tenant storage folders:`);
    demoSlugs.forEach(slug => console.log(`   - tenants/${slug}/`));

    if (DRY) {
      console.log("");
      console.log("🔍 DRY RUN COMPLETE - No files were deleted");
      console.log("   To actually delete, run: CONFIRM_PURGE=YES npm run purge:storage");
      return;
    }

    console.log("");
    console.log("⚠️  LIVE DELETE MODE - This will permanently delete storage files!");
    console.log("   Proceeding with deletion in 3 seconds...");
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("");
    console.log("🗑️  Starting storage cleanup...");

    // Purge each tenant's storage folder
    for (const slug of demoSlugs) {
      await purgeFolder(`tenants/${slug}`);
    }

    console.log("");
    console.log("✅ Storage purge complete!");
    console.log(`   Cleaned up storage for ${demoSlugs.length} demo tenants`);

  } catch (error: any) {
    console.error("❌ Error accessing Firestore:", error.message);
    process.exit(1);
  }
}

main().then(() => {
  console.log("");
  console.log("🏁 Storage purge script completed");
  process.exit(0);
}).catch(e => {
  console.error("");
  console.error("❌ Storage purge script failed:");
  console.error(e);
  process.exit(1);
});