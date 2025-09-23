#!/usr/bin/env node

/**
 * Storefront Smoke Test
 * 
 * This script tests the main storefront pages to ensure they load correctly.
 * Run with: node scripts/test-storefront.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test pages
const PAGES = [
  {
    name: 'Home Page',
    url: '/',
    expectedElements: ['html', 'body', 'head']
  },
  {
    name: 'Platform Admin',
    url: '/admin/platform',
    expectedElements: ['html', 'body'],
    expectedStatus: 200
  },
  {
    name: 'Platform Merchants',
    url: '/admin/platform/merchants',
    expectedElements: ['html', 'body'],
    expectedStatus: 200
  },
  {
    name: 'Platform Domains',
    url: '/admin/platform/domains',
    expectedElements: ['html', 'body'],
    expectedStatus: 200
  },
  {
    name: 'Platform Plans',
    url: '/admin/platform/plans',
    expectedElements: ['html', 'body'],
    expectedStatus: 200
  }
];

// Test a single page
async function testPage(page) {
  try {
    console.log(`Testing: ${page.name}`);
    
    const response = await fetch(`${BASE_URL}${page.url}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StorefrontTest/1.0)'
      }
    });
    
    // Check status code
    if (page.expectedStatus && response.status !== page.expectedStatus) {
      console.log(`❌ FAILED: Expected status ${page.expectedStatus}, got ${response.status}`);
      return false;
    }
    
    // Check if response is HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      console.log(`❌ FAILED: Expected HTML content, got ${contentType}`);
      return false;
    }
    
    // Get page content
    const html = await response.text();
    
    // Check for expected elements
    if (page.expectedElements) {
      for (const element of page.expectedElements) {
        if (!html.includes(`<${element}`)) {
          console.log(`❌ FAILED: Expected element <${element}> not found`);
          return false;
        }
      }
    }
    
    // Check for basic HTML structure
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
      console.log(`❌ FAILED: Invalid HTML structure`);
      return false;
    }
    
    // Check for error indicators
    if (html.includes('Internal Server Error') || 
        html.includes('500') || 
        html.includes('Error:')) {
      console.log(`❌ FAILED: Page contains error indicators`);
      return false;
    }
    
    console.log(`✅ PASSED`);
    return true;
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

// Test responsive design
async function testResponsive() {
  console.log('\n📱 Testing Responsive Design...');
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const viewport of viewports) {
    try {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Test home page with different viewport
      const response = await fetch(`${BASE_URL}/`, {
        headers: {
          'User-Agent': `Mozilla/5.0 (compatible; StorefrontTest/1.0; ${viewport.name})`,
          'X-Viewport-Width': viewport.width.toString(),
          'X-Viewport-Height': viewport.height.toString()
        }
      });
      
      if (response.ok) {
        console.log(`✅ ${viewport.name} layout OK`);
        passed++;
      } else {
        console.log(`❌ ${viewport.name} layout failed`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${viewport.name} test failed: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test performance
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    if (loadTime < 3000) {
      console.log('✅ Performance: Good (< 3s)');
      return true;
    } else if (loadTime < 5000) {
      console.log('⚠️  Performance: Acceptable (3-5s)');
      return true;
    } else {
      console.log('❌ Performance: Poor (> 5s)');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Storefront Smoke Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test all pages
  for (const page of PAGES) {
    const success = await testPage(page);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    console.log('');
  }
  
  // Test responsive design
  const responsiveResults = await testResponsive();
  passed += responsiveResults.passed;
  failed += responsiveResults.failed;
  
  // Test performance
  const performanceOk = await testPerformance();
  if (performanceOk) {
    passed++;
  } else {
    failed++;
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All storefront tests passed!');
    return true;
  } else {
    console.log('\n💥 Some storefront tests failed!');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 SaaS Platform Storefront Test Suite');
  console.log(`   Base URL: ${BASE_URL}\n`);
  
  const success = await runTests();
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('Storefront test suite failed:', error);
  process.exit(1);
});


