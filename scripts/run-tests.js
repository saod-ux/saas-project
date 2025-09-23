#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs all tests in the correct order and provides a summary.
 * Run with: node scripts/run-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TESTS = [
  {
    name: 'API Tests',
    script: 'test-api.js',
    description: 'Tests all API endpoints for correct responses'
  },
  {
    name: 'Storefront Tests',
    script: 'test-storefront.js',
    description: 'Tests storefront pages and responsive design'
  },
  {
    name: 'TypeScript Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    description: 'Checks for TypeScript compilation errors'
  },
  {
    name: 'Build Test',
    command: 'npm',
    args: ['run', 'build'],
    description: 'Tests production build process'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Run a single test
function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${colors.cyan}🧪 Running ${test.name}...${colors.reset}`);
    console.log(`${colors.blue}   ${test.description}${colors.reset}\n`);
    
    const startTime = Date.now();
    
    let command, args;
    
    if (test.command) {
      command = test.command;
      args = test.args || [];
    } else {
      command = 'node';
      args = [path.join(__dirname, test.script)];
    }
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        console.log(`\n${colors.green}✅ ${test.name} passed (${duration}s)${colors.reset}`);
        resolve({ name: test.name, success: true, duration });
      } else {
        console.log(`\n${colors.red}❌ ${test.name} failed (${duration}s)${colors.reset}`);
        resolve({ name: test.name, success: false, duration });
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n${colors.red}❌ ${test.name} error: ${error.message}${colors.reset}`);
      resolve({ name: test.name, success: false, duration: 0 });
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 SaaS Platform Test Suite${colors.reset}`);
  console.log(`${colors.blue}   Running comprehensive tests for production readiness${colors.reset}\n`);
  
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;
  
  // Run each test
  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      totalPassed++;
    } else {
      totalFailed++;
    }
    
    totalDuration += result.duration;
  }
  
  // Print summary
  console.log(`\n${colors.bright}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  
  results.forEach(result => {
    const status = result.success ? 
      `${colors.green}✅ PASSED${colors.reset}` : 
      `${colors.red}❌ FAILED${colors.reset}`;
    
    console.log(`${result.name.padEnd(20)} ${status} (${result.duration}s)`);
  });
  
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}Total: ${totalPassed} passed, ${totalFailed} failed (${totalDuration.toFixed(2)}s)${colors.reset}`);
  
  // Final result
  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}🎉 All tests passed! Platform is ready for production.${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.red}${colors.bright}💥 Some tests failed! Please fix issues before deploying.${colors.reset}`);
    return false;
  }
}

// Check if we're in the right directory
function checkEnvironment() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (!require('fs').existsSync(packageJsonPath)) {
    console.error(`${colors.red}❌ Error: package.json not found. Please run this script from the project root.${colors.reset}`);
    process.exit(1);
  }
  
  if (!require('fs').existsSync(prismaSchemaPath)) {
    console.error(`${colors.red}❌ Error: Prisma schema not found. Please run this script from the project root.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Environment check passed${colors.reset}`);
}

// Main execution
async function main() {
  try {
    checkEnvironment();
    const success = await runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}❌ Test runner failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled Rejection at:${colors.reset}`, promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main();


