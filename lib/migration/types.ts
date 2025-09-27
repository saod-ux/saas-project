/**
 * Data Migration and Seeding System - Types
 * 
 * Defines types and interfaces for the migration and seeding system.
 */

export interface Migration {
  id: string;
  name: string;
  description: string;
  version: string;
  up: (context: MigrationContext) => Promise<void>;
  down: (context: MigrationContext) => Promise<void>;
  dependencies?: string[];
  runOnSeed?: boolean;
}

export interface MigrationContext {
  db: any; // Firestore instance
  logger: (message: string, data?: any) => void;
  tenantId?: string;
  dryRun?: boolean;
}

export interface SeedData {
  tenants?: TenantSeedData[];
  users?: UserSeedData[];
  categories?: CategorySeedData[];
  products?: ProductSeedData[];
  settings?: SettingsSeedData[];
}

export interface TenantSeedData {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  plan?: 'free' | 'basic' | 'premium' | 'enterprise';
  ownerEmail: string;
  settings?: any;
}

export interface UserSeedData {
  id?: string;
  email: string;
  name: string;
  role?: 'customer' | 'admin' | 'owner';
  tenantId?: string;
  isActive?: boolean;
}

export interface CategorySeedData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  tenantId?: string;
  sortOrder?: number;
}

export interface ProductSeedData {
  id?: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  categoryIds?: string[];
  tenantId?: string;
  inventory?: {
    trackQuantity: boolean;
    quantity: number;
    allowBackorder: boolean;
  };
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
}

export interface SettingsSeedData {
  tenantId: string;
  settings: any;
}

export interface MigrationResult {
  success: boolean;
  migrationId: string;
  duration: number;
  error?: string;
  recordsAffected?: number;
}

export interface SeedResult {
  success: boolean;
  seedType: string;
  duration: number;
  recordsCreated: number;
  error?: string;
}

export interface MigrationStatus {
  id: string;
  name: string;
  version: string;
  applied: boolean;
  appliedAt?: Date;
  duration?: number;
  error?: string;
}

export interface SeedStatus {
  type: string;
  applied: boolean;
  appliedAt?: Date;
  recordsCreated: number;
  error?: string;
}

