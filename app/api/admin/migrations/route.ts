/**
 * Migration Management API
 * 
 * Handles database migrations and seeding operations.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, badRequest, errorResponse } from '@/lib/http/responses';
import { logger, createRequestContext } from '@/lib/logging';
import { withApiRateLimit } from '@/lib/rate-limiting';
import { withApiSecurityHeaders } from '@/lib/security/headers';
import { migrationManager, seedManager } from '@/lib/migration/manager';
import { demoSeedData } from '@/lib/migration/seeds/demo_data';
import { migration001 } from '@/lib/migration/migrations/001_initial_schema';

// Register migrations
migrationManager.registerMigration(migration001);

const RunMigrationsSchema = z.object({
  dryRun: z.boolean().optional().default(false)
});

const RunSeedsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  seedType: z.enum(['demo', 'custom']).optional().default('demo'),
  customData: z.any().optional()
});

const RollbackSchema = z.object({
  migrationId: z.string().min(1, 'Migration ID is required'),
  dryRun: z.boolean().optional().default(false)
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiSecurityHeaders(withApiRateLimit(async function(
  request: NextRequest
) {
  const context = createRequestContext(request);
  
  try {
    logger.info('Getting migration status', context);
    
    const status = await migrationManager.getMigrationStatus();
    
    return ok({
      migrations: status,
      totalMigrations: status.length,
      appliedMigrations: status.filter(m => m.applied).length,
      pendingMigrations: status.filter(m => !m.applied).length
    });
    
  } catch (error) {
    logger.error('Error getting migration status', context, error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to get migration status');
  }
}));

export const POST = withApiSecurityHeaders(withApiRateLimit(async function(
  request: NextRequest
) {
  const context = createRequestContext(request);
  const startedAt = Date.now();
  
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'run-migrations': {
        const { dryRun } = RunMigrationsSchema.parse(body);
        
        logger.info('Running migrations', { ...context, dryRun });
        
        const results = await migrationManager.runMigrations(dryRun);
        
        const duration = Date.now() - startedAt;
        logger.info('Migrations completed', { ...context, duration, resultsCount: results.length });
        
        return ok({
          action: 'run-migrations',
          dryRun,
          results,
          duration,
          success: results.every(r => r.success)
        });
      }
      
      case 'run-seeds': {
        const { dryRun, seedType, customData } = RunSeedsSchema.parse(body);
        
        logger.info('Running seeds', { ...context, dryRun, seedType });
        
        const seedData = seedType === 'demo' ? demoSeedData : customData;
        if (!seedData) {
          return badRequest('Custom seed data is required when seedType is custom');
        }
        
        const results = await seedManager.runSeeds(seedData, dryRun);
        
        const duration = Date.now() - startedAt;
        logger.info('Seeds completed', { ...context, duration, resultsCount: results.length });
        
        return ok({
          action: 'run-seeds',
          dryRun,
          seedType,
          results,
          duration,
          success: results.every(r => r.success)
        });
      }
      
      case 'rollback': {
        const { migrationId, dryRun } = RollbackSchema.parse(body);
        
        logger.info('Rolling back migration', { ...context, migrationId, dryRun });
        
        const result = await migrationManager.rollbackMigration(migrationId, dryRun);
        
        const duration = Date.now() - startedAt;
        logger.info('Migration rollback completed', { ...context, duration, success: result.success });
        
        return ok({
          action: 'rollback',
          migrationId,
          dryRun,
          result,
          duration
        });
      }
      
      default:
        return badRequest('Invalid action. Supported actions: run-migrations, run-seeds, rollback');
    }
    
  } catch (error) {
    const duration = Date.now() - startedAt;
    
    if (error instanceof z.ZodError) {
      logger.warn('Migration API validation failed', { ...context, validationErrors: error.errors, duration });
      return badRequest('Validation error', { details: error.errors });
    }
    
    logger.error('Migration API error', { ...context, duration }, error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Migration operation failed');
  }
}));

