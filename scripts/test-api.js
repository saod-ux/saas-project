#!/usr/bin/env node

/**
 * API Testing Utility
 * 
 * This script tests the main API endpoints to ensure they're working correctly.
 * Run with: node scripts/test-api.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test configuration
const TESTS = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/api/health',
    expectedStatus: 200,
    expectedData: { status: 'ok' }
  },
  {
    name: 'Domain Lookup (Empty)',
    method: 'GET',
    url: '/api/v1/domain-lookup?host=example.com',
    expectedStatus: 200,
    expectedData: { found: false }
  },
  {
    name: 'Platform Plans (Unauthorized)',
    method: 'GET',
    url: '/api/platform/plans',
    expectedStatus: 401,
    expectedData: { error: 'Unauthorized' }
  },
  {
    name: 'Platform Tenants (Unauthorized)',
    method: 'GET',
    url: '/api/platform/tenants',
    expectedStatus: 401,
    expectedData: { error: 'Unauthorized' }
  }
];

// Test runner
async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // Check status code
      if (response.status !== test.expectedStatus) {
        console.log(`❌ FAILED: Expected status ${test.expectedStatus}, got ${response.status}`);
        console.log(`   Response:`, data);
        failed++;
        continue;
      }
      
      // Check response data (if specified)
      if (test.expectedData) {
        const dataMatches = Object.keys(test.expectedData).every(key => 
          data[key] === test.expectedData[key]
        );
        
        if (!dataMatches) {
          console.log(`❌ FAILED: Response data doesn't match expected`);
          console.log(`   Expected:`, test.expectedData);
          console.log(`   Got:`, data);
          failed++;
          continue;
        }
      }
      
      console.log(`✅ PASSED`);
      passed++;
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

// Database connectivity test
async function testDatabase() {
  console.log('🗄️  Testing Database Connectivity...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (data.status === 'ok' && data.database === 'connected') {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 SaaS Platform API Test Suite');
  console.log(`   Base URL: ${BASE_URL}\n`);
  
  // Test database first
  const dbConnected = await testDatabase();
  console.log('');
  
  if (!dbConnected) {
    console.log('💥 Database not available, skipping API tests');
    process.exit(1);
  }
  
  // Run API tests
  await runTests();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});


