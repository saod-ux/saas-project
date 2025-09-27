/**
 * Migration System - Main Export
 * 
 * Exports all migration and seeding functionality.
 */

export * from './types';
export * from './manager';
export { migration001 } from './migrations/001_initial_schema';
export { demoSeedData } from './seeds/demo_data';

