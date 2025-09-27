/**
 * Data Migration and Seeding System - Manager
 * 
 * Manages database migrations and data seeding operations.
 */

import { getServerDb } from '@/lib/firebase/db';
import { logger } from '@/lib/logging';
import { 
  Migration, 
  MigrationContext, 
  MigrationResult, 
  MigrationStatus,
  SeedData,
  SeedResult,
  SeedStatus
} from './types';

export class MigrationManager {
  private db: any;
  private migrations: Migration[] = [];
  private appliedMigrations: Set<string> = new Set();

  constructor() {
    this.db = null; // Will be initialized when needed
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await getServerDb();
    }
    
    // Load applied migrations
    await this.loadAppliedMigrations();
  }

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async runMigrations(dryRun: boolean = false): Promise<MigrationResult[]> {
    await this.initialize();
    
    const results: MigrationResult[] = [];
    const pendingMigrations = this.getPendingMigrations();

    logger.info(`Running ${pendingMigrations.length} pending migrations`, { 
      dryRun, 
      pendingMigrations: pendingMigrations.map(m => ({ id: m.id, name: m.name, version: m.version }))
    });

    for (const migration of pendingMigrations) {
      const result = await this.runMigration(migration, dryRun);
      results.push(result);
      
      if (!result.success && !dryRun) {
        logger.error(`Migration ${migration.id} failed, stopping migration process`, { error: result.error });
        break;
      }
    }

    return results;
  }

  async runMigration(migration: Migration, dryRun: boolean = false): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Running migration: ${migration.name} (${migration.id})`, { 
        version: migration.version, 
        dryRun 
      });

      const context: MigrationContext = {
        db: this.db,
        logger: (message: string, data?: any) => logger.info(`[${migration.id}] ${message}`, data),
        dryRun
      };

      if (!dryRun) {
        await migration.up(context);
        await this.recordMigration(migration, startTime);
      }

      const duration = Date.now() - startTime;
      logger.info(`Migration ${migration.id} completed successfully`, { duration });

      return {
        success: true,
        migrationId: migration.id,
        duration,
        recordsAffected: 0 // Could be enhanced to track this
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`Migration ${migration.id} failed`, { error: errorMessage, duration });

      return {
        success: false,
        migrationId: migration.id,
        duration,
        error: errorMessage
      };
    }
  }

  async rollbackMigration(migrationId: string, dryRun: boolean = false): Promise<MigrationResult> {
    await this.initialize();
    
    const migration = this.migrations.find(m => m.id === migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    if (!this.appliedMigrations.has(migrationId)) {
      throw new Error(`Migration ${migrationId} has not been applied`);
    }

    const startTime = Date.now();
    
    try {
      logger.info(`Rolling back migration: ${migration.name} (${migration.id})`, { dryRun });

      const context: MigrationContext = {
        db: this.db,
        logger: (message: string, data?: any) => logger.info(`[ROLLBACK:${migration.id}] ${message}`, data),
        dryRun
      };

      if (!dryRun) {
        await migration.down(context);
        await this.removeMigrationRecord(migrationId);
      }

      const duration = Date.now() - startTime;
      logger.info(`Migration ${migration.id} rolled back successfully`, { duration });

      return {
        success: true,
        migrationId: migration.id,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`Migration rollback ${migration.id} failed`, { error: errorMessage, duration });

      return {
        success: false,
        migrationId: migration.id,
        duration,
        error: errorMessage
      };
    }
  }

  async getMigrationStatus(): Promise<MigrationStatus[]> {
    await this.initialize();
    
    return this.migrations.map(migration => ({
      id: migration.id,
      name: migration.name,
      version: migration.version,
      applied: this.appliedMigrations.has(migration.id)
    }));
  }

  private async loadAppliedMigrations(): Promise<void> {
    try {
      const migrationsSnapshot = await this.db.collection('_migrations').get();
      migrationsSnapshot.forEach((doc: any) => {
        this.appliedMigrations.add(doc.id);
      });
    } catch (error) {
      logger.warn('Could not load applied migrations, assuming none applied', { error });
    }
  }

  private async recordMigration(migration: Migration, startTime: number): Promise<void> {
    const duration = Date.now() - startTime;
    
    await this.db.collection('_migrations').doc(migration.id).set({
      id: migration.id,
      name: migration.name,
      version: migration.version,
      appliedAt: new Date(),
      duration
    });
    
    this.appliedMigrations.add(migration.id);
  }

  private async removeMigrationRecord(migrationId: string): Promise<void> {
    await this.db.collection('_migrations').doc(migrationId).delete();
    this.appliedMigrations.delete(migrationId);
  }

  private getPendingMigrations(): Migration[] {
    return this.migrations.filter(migration => !this.appliedMigrations.has(migration.id));
  }
}

export class SeedManager {
  private db: any;
  private appliedSeeds: Set<string> = new Set();

  constructor() {
    this.db = null; // Will be initialized when needed
  }

  async initialize(): Promise<void> {
    if (!this.db) {
      this.db = await getServerDb();
    }
    
    // Load applied seeds
    await this.loadAppliedSeeds();
  }

  async runSeeds(seedData: SeedData, dryRun: boolean = false): Promise<SeedResult[]> {
    await this.initialize();
    
    const results: SeedResult[] = [];

    // Run seeds in order
    if (seedData.tenants) {
      const result = await this.seedTenants(seedData.tenants, dryRun);
      results.push(result);
    }

    if (seedData.users) {
      const result = await this.seedUsers(seedData.users, dryRun);
      results.push(result);
    }

    if (seedData.categories) {
      const result = await this.seedCategories(seedData.categories, dryRun);
      results.push(result);
    }

    if (seedData.products) {
      const result = await this.seedProducts(seedData.products, dryRun);
      results.push(result);
    }

    if (seedData.settings) {
      const result = await this.seedSettings(seedData.settings, dryRun);
      results.push(result);
    }

    return results;
  }

  private async seedTenants(tenants: any[], dryRun: boolean): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;

    try {
      for (const tenantData of tenants) {
        if (!dryRun) {
          const tenantId = tenantData.id || `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await this.db.collection('tenants').doc(tenantId).set({
            id: tenantId,
            slug: tenantData.slug,
            name: tenantData.name,
            description: tenantData.description,
            plan: tenantData.plan || 'free',
            status: 'active',
            settings: tenantData.settings || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          recordsCreated++;
        }
      }

      return {
        success: true,
        seedType: 'tenants',
        duration: Date.now() - startTime,
        recordsCreated
      };

    } catch (error) {
      return {
        success: false,
        seedType: 'tenants',
        duration: Date.now() - startTime,
        recordsCreated,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async seedUsers(users: any[], dryRun: boolean): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;

    try {
      for (const userData of users) {
        if (!dryRun) {
          const userId = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await this.db.collection('users').doc(userId).set({
            id: userId,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'customer',
            tenantId: userData.tenantId,
            isActive: userData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          recordsCreated++;
        }
      }

      return {
        success: true,
        seedType: 'users',
        duration: Date.now() - startTime,
        recordsCreated
      };

    } catch (error) {
      return {
        success: false,
        seedType: 'users',
        duration: Date.now() - startTime,
        recordsCreated,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async seedCategories(categories: any[], dryRun: boolean): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;

    try {
      for (const categoryData of categories) {
        if (!dryRun) {
          const categoryId = categoryData.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Resolve tenant ID from slug if needed
          let tenantId = categoryData.tenantId;
          if (typeof tenantId === 'string' && !tenantId.startsWith('tenant_')) {
            // This is a slug, need to resolve to actual tenant ID
            const tenantsSnapshot = await this.db.collection('tenants')
              .where('slug', '==', tenantId)
              .get();
            
            if (!tenantsSnapshot.empty) {
              tenantId = tenantsSnapshot.docs[0].id;
            }
          }
          
          await this.db.collection('categories').doc(categoryId).set({
            id: categoryId,
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description,
            parentId: categoryData.parentId,
            tenantId: tenantId,
            sortOrder: categoryData.sortOrder || 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          recordsCreated++;
        }
      }

      return {
        success: true,
        seedType: 'categories',
        duration: Date.now() - startTime,
        recordsCreated
      };

    } catch (error) {
      return {
        success: false,
        seedType: 'categories',
        duration: Date.now() - startTime,
        recordsCreated,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async seedProducts(products: any[], dryRun: boolean): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;

    try {
      for (const productData of products) {
        if (!dryRun) {
          const productId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Resolve tenant ID from slug if needed
          let tenantId = productData.tenantId;
          if (typeof tenantId === 'string' && !tenantId.startsWith('tenant_')) {
            // This is a slug, need to resolve to actual tenant ID
            const tenantsSnapshot = await this.db.collection('tenants')
              .where('slug', '==', tenantId)
              .get();
            
            if (!tenantsSnapshot.empty) {
              tenantId = tenantsSnapshot.docs[0].id;
            }
          }
          
          await this.db.collection('products').doc(productId).set({
            id: productId,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            compareAtPrice: productData.compareAtPrice,
            sku: productData.sku,
            status: productData.status || 'active',
            categories: productData.categoryIds || [],
            tenantId: tenantId,
            inventory: productData.inventory || {
              trackQuantity: false,
              quantity: 0,
              allowBackorder: false
            },
            images: productData.images || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          recordsCreated++;
        }
      }

      return {
        success: true,
        seedType: 'products',
        duration: Date.now() - startTime,
        recordsCreated
      };

    } catch (error) {
      return {
        success: false,
        seedType: 'products',
        duration: Date.now() - startTime,
        recordsCreated,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async seedSettings(settings: any[], dryRun: boolean): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;

    try {
      for (const settingData of settings) {
        if (!dryRun) {
          await this.db.collection('tenants').doc(settingData.tenantId).update({
            settings: settingData.settings
          });
          
          recordsCreated++;
        }
      }

      return {
        success: true,
        seedType: 'settings',
        duration: Date.now() - startTime,
        recordsCreated
      };

    } catch (error) {
      return {
        success: false,
        seedType: 'settings',
        duration: Date.now() - startTime,
        recordsCreated,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async loadAppliedSeeds(): Promise<void> {
    try {
      const seedsSnapshot = await this.db.collection('_seeds').get();
      seedsSnapshot.forEach((doc: any) => {
        this.appliedSeeds.add(doc.id);
      });
    } catch (error) {
      logger.warn('Could not load applied seeds, assuming none applied', { error });
    }
  }
}

// Global instances
export const migrationManager = new MigrationManager();
export const seedManager = new SeedManager();
