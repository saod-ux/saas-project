#!/usr/bin/env node

/**
 * Storage Configuration Validation Script
 * 
 * This script validates that all storage-related configuration is consistent
 * across the codebase and enforces the single source of truth.
 */

const fs = require('fs');
const path = require('path');

// Expected configuration
const EXPECTED_BUCKET = 'e-viewstorage-public';
const EXPECTED_URL_BASE = 'https://storage.googleapis.com';

// Files to check for bucket references
const FILES_TO_CHECK = [
  'lib/firebase/client.ts',
  'lib/firebase/client-simple.ts',
  'lib/firebase/server-only.ts',
  'lib/firebase/storage-server.ts',
  'FIREBASE_SETUP.md',
  'docs/PRODUCTION_READY_SUMMARY.md',
  'README.md',
];

// Patterns to check for
const PATTERNS = {
  // Legacy bucket names that should be removed
  legacyBuckets: [
    /demo-project\.appspot\.com/g,
    /your-project\.appspot\.com/g,
    /e-viewstorage(?!-public)/g,
  ],
  
  // Legacy URL formats
  legacyUrls: [
    /firebasestorage\.googleapis\.com/g,
    /v0\/b\/[^\/]+\/o\//g,
  ],
  
  // Supabase/Cloudflare references that shouldn't exist
  wrongProviders: [
    /supabase/gi,
    /cloudflare/gi,
    /r2/gi,
  ],
};

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { errors: [], warnings: [] };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const errors = [];
  const warnings = [];
  
  // Check for legacy bucket names
  PATTERNS.legacyBuckets.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      errors.push(`Legacy bucket pattern found: ${matches[0]} (line ${getLineNumber(content, matches[0])})`);
    }
  });
  
  // Check for legacy URL formats
  PATTERNS.legacyUrls.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      errors.push(`Legacy URL format found: ${matches[0]} (line ${getLineNumber(content, matches[0])})`);
    }
  });
  
  // Check for wrong provider references
  PATTERNS.wrongProviders.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      warnings.push(`Unexpected provider reference: ${matches[0]} (line ${getLineNumber(content, matches[0])})`);
    }
  });
  
  // Check for hardcoded bucket names that aren't the expected one
  const hardcodedBuckets = content.match(/'[^']*\.appspot\.com'/g) || [];
  hardcodedBuckets.forEach(bucket => {
    if (!bucket.includes(EXPECTED_BUCKET)) {
      errors.push(`Hardcoded bucket name: ${bucket} (line ${getLineNumber(content, bucket)})`);
    }
  });
  
  return { errors, warnings };
}

function getLineNumber(content, searchString) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 'unknown';
}

function validateStorageConfig() {
  console.log('🔍 Validating Storage Configuration...\n');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  FILES_TO_CHECK.forEach(filePath => {
    console.log(`📁 Checking ${filePath}...`);
    const { errors, warnings } = checkFile(filePath);
    
    if (errors.length > 0) {
      console.log(`  ❌ ${errors.length} error(s):`);
      errors.forEach(error => console.log(`    - ${error}`));
      totalErrors += errors.length;
    }
    
    if (warnings.length > 0) {
      console.log(`  ⚠️  ${warnings.length} warning(s):`);
      warnings.forEach(warning => console.log(`    - ${warning}`));
      totalWarnings += warnings.length;
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  ✅ No issues found`);
    }
    
    console.log('');
  });
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log(`  - Total errors: ${totalErrors}`);
  console.log(`  - Total warnings: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('\n✅ Storage configuration is consistent!');
    console.log(`   - Bucket: ${EXPECTED_BUCKET}`);
    console.log(`   - URL Base: ${EXPECTED_URL_BASE}`);
    return true;
  } else {
    console.log('\n❌ Storage configuration has issues that need to be fixed.');
    return false;
  }
}

// Run validation
if (require.main === module) {
  const isValid = validateStorageConfig();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateStorageConfig };
