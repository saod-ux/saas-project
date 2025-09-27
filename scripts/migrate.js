#!/usr/bin/env node

/**
 * Migration CLI Script
 * 
 * Command-line tool for running database migrations and seeds.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function showHelp() {
  log('\n📋 Migration CLI Help', 'bright');
  log('====================', 'bright');
  log('');
  log('Usage: node scripts/migrate.js <command> [options]', 'cyan');
  log('');
  log('Commands:', 'bright');
  log('  status                    Show migration status', 'cyan');
  log('  migrate [--dry-run]       Run pending migrations', 'cyan');
  log('  rollback <migration-id>   Rollback a specific migration', 'cyan');
  log('  seed [--dry-run]          Run database seeds', 'cyan');
  log('  reset                     Reset database (run all migrations and seeds)', 'cyan');
  log('');
  log('Options:', 'bright');
  log('  --dry-run                 Show what would be done without making changes', 'yellow');
  log('  --help, -h                Show this help message', 'yellow');
  log('');
  log('Examples:', 'bright');
  log('  node scripts/migrate.js status', 'cyan');
  log('  node scripts/migrate.js migrate --dry-run', 'cyan');
  log('  node scripts/migrate.js migrate', 'cyan');
  log('  node scripts/migrate.js rollback 001_initial_schema', 'cyan');
  log('  node scripts/migrate.js seed --dry-run', 'cyan');
  log('  node scripts/migrate.js seed', 'cyan');
  log('  node scripts/migrate.js reset', 'cyan');
  log('');
}

async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    if (error.message.includes('fetch is not defined')) {
      // Fallback to curl for Node.js environments without fetch
      return makeCurlRequest(endpoint, method, body);
    }
    throw error;
  }
}

function makeCurlRequest(endpoint, method = 'GET', body = null) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}${endpoint}`;
  
  let curlCmd = `curl -s -X ${method}`;
  curlCmd += ` -H "Content-Type: application/json"`;
  
  if (body) {
    curlCmd += ` -d '${JSON.stringify(body)}'`;
  }
  
  curlCmd += ` "${url}"`;
  
  try {
    const result = execSync(curlCmd, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

async function showStatus() {
  try {
    logInfo('Fetching migration status...');
    const data = await makeApiRequest('/api/admin/migrations');
    
    log('\n📊 Migration Status', 'bright');
    log('==================', 'bright');
    log('');
    log(`Total Migrations: ${data.data.totalMigrations}`, 'cyan');
    log(`Applied: ${data.data.appliedMigrations}`, 'green');
    log(`Pending: ${data.data.pendingMigrations}`, 'yellow');
    log('');
    
    if (data.data.migrations.length > 0) {
      log('Migration Details:', 'bright');
      data.data.migrations.forEach(migration => {
        const status = migration.applied ? '✅ Applied' : '⏳ Pending';
        const statusColor = migration.applied ? 'green' : 'yellow';
        log(`  ${migration.id} - ${migration.name} (${migration.version}) - ${status}`, statusColor);
      });
    }
    
  } catch (error) {
    logError(`Failed to get migration status: ${error.message}`);
    process.exit(1);
  }
}

async function runMigrations(dryRun = false) {
  try {
    logInfo(`Running migrations${dryRun ? ' (dry run)' : ''}...`);
    
    const data = await makeApiRequest('/api/admin/migrations', 'POST', {
      action: 'run-migrations',
      dryRun
    });
    
    log('\n🔄 Migration Results', 'bright');
    log('===================', 'bright');
    log('');
    log(`Duration: ${data.data.duration}ms`, 'cyan');
    log(`Success: ${data.data.success ? 'Yes' : 'No'}`, data.data.success ? 'green' : 'red');
    log('');
    
    if (data.data.results.length > 0) {
      data.data.results.forEach(result => {
        const status = result.success ? '✅ Success' : '❌ Failed';
        const statusColor = result.success ? 'green' : 'red';
        log(`  ${result.migrationId} - ${status} (${result.duration}ms)`, statusColor);
        
        if (!result.success && result.error) {
          log(`    Error: ${result.error}`, 'red');
        }
      });
    } else {
      log('No migrations to run', 'yellow');
    }
    
  } catch (error) {
    logError(`Failed to run migrations: ${error.message}`);
    process.exit(1);
  }
}

async function rollbackMigration(migrationId, dryRun = false) {
  try {
    logInfo(`Rolling back migration ${migrationId}${dryRun ? ' (dry run)' : ''}...`);
    
    const data = await makeApiRequest('/api/admin/migrations', 'POST', {
      action: 'rollback',
      migrationId,
      dryRun
    });
    
    log('\n⏪ Rollback Results', 'bright');
    log('==================', 'bright');
    log('');
    log(`Migration: ${data.data.migrationId}`, 'cyan');
    log(`Duration: ${data.data.duration}ms`, 'cyan');
    log(`Success: ${data.data.result.success ? 'Yes' : 'No'}`, data.data.result.success ? 'green' : 'red');
    
    if (!data.data.result.success && data.data.result.error) {
      log(`Error: ${data.data.result.error}`, 'red');
    }
    
  } catch (error) {
    logError(`Failed to rollback migration: ${error.message}`);
    process.exit(1);
  }
}

async function runSeeds(dryRun = false) {
  try {
    logInfo(`Running seeds${dryRun ? ' (dry run)' : ''}...`);
    
    const data = await makeApiRequest('/api/admin/migrations', 'POST', {
      action: 'run-seeds',
      dryRun,
      seedType: 'demo'
    });
    
    log('\n🌱 Seed Results', 'bright');
    log('===============', 'bright');
    log('');
    log(`Duration: ${data.data.duration}ms`, 'cyan');
    log(`Success: ${data.data.success ? 'Yes' : 'No'}`, data.data.success ? 'green' : 'red');
    log('');
    
    if (data.data.results.length > 0) {
      data.data.results.forEach(result => {
        const status = result.success ? '✅ Success' : '❌ Failed';
        const statusColor = result.success ? 'green' : 'red';
        log(`  ${result.seedType} - ${status} (${result.recordsCreated} records, ${result.duration}ms)`, statusColor);
        
        if (!result.success && result.error) {
          log(`    Error: ${result.error}`, 'red');
        }
      });
    } else {
      log('No seeds to run', 'yellow');
    }
    
  } catch (error) {
    logError(`Failed to run seeds: ${error.message}`);
    process.exit(1);
  }
}

async function resetDatabase() {
  try {
    logWarning('This will reset the database by running all migrations and seeds.');
    logWarning('This action cannot be undone!');
    log('');
    
    // In a real implementation, you might want to add a confirmation prompt here
    logInfo('Proceeding with database reset...');
    
    // Run migrations first
    await runMigrations(false);
    log('');
    
    // Then run seeds
    await runSeeds(false);
    
    logSuccess('Database reset completed successfully!');
    
  } catch (error) {
    logError(`Failed to reset database: ${error.message}`);
    process.exit(1);
  }
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  const command = args[0];
  const dryRun = args.includes('--dry-run');
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
      
    case 'migrate':
      await runMigrations(dryRun);
      break;
      
    case 'rollback':
      const migrationId = args[1];
      if (!migrationId) {
        logError('Migration ID is required for rollback command');
        log('Usage: node scripts/migrate.js rollback <migration-id>', 'cyan');
        process.exit(1);
      }
      await rollbackMigration(migrationId, dryRun);
      break;
      
    case 'seed':
      await runSeeds(dryRun);
      break;
      
    case 'reset':
      await resetDatabase();
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      log('');
      showHelp();
      process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the CLI
main().catch(error => {
  logError(`CLI Error: ${error.message}`);
  process.exit(1);
});
