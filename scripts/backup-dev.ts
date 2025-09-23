#!/usr/bin/env tsx

/**
 * DEVELOPMENT BACKUP SCRIPT
 * 
 * Creates a database backup for development purposes
 * For production, use proper backup tools like pg_dump with scheduling
 * 
 * Usage: pnpm backup:dev
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🗄️  Starting development database backup...');
  
  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse database URL to extract connection details
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1); // Remove leading slash
    const username = url.username;
    const password = url.password;

    // Create backups directory if it doesn't exist
    const backupsDir = join(process.cwd(), 'backups');
    mkdirSync(backupsDir, { recursive: true });

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = join(backupsDir, `dev-${timestamp}.sql`);

    console.log(`📦 Creating backup: ${backupFile}`);

    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: password
    };

    // Run pg_dump
    const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password --verbose --clean --if-exists --create`;
    
    execSync(pgDumpCommand, {
      env,
      stdio: 'pipe'
    });

    // Write the backup to file
    const backupData = execSync(pgDumpCommand, {
      env,
      encoding: 'utf8'
    });

    writeFileSync(backupFile, backupData);

    console.log('✅ Backup completed successfully!');
    console.log(`   File: ${backupFile}`);
    console.log(`   Size: ${(backupData.length / 1024).toFixed(2)} KB`);
    console.log('');
    console.log('📝 To restore this backup:');
    console.log(`   psql -h ${host} -p ${port} -U ${username} -d ${database} < ${backupFile}`);
    console.log('');
    console.log('⚠️  For production backups:');
    console.log('   - Use automated backup tools (AWS RDS, Google Cloud SQL, etc.)');
    console.log('   - Schedule regular backups (daily/hourly)');
    console.log('   - Test restore procedures regularly');
    console.log('   - Store backups in secure, off-site locations');
    console.log('   - Consider point-in-time recovery options');

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


