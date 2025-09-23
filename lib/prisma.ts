// Prisma compatibility layer for migration to Firebase
// This file provides a compatibility layer for existing Prisma code
// while we migrate to Firebase Firestore

import { prisma, prismaRW } from './db';

// Re-export the Prisma compatibility layer
export { prisma, prismaRW };

// Legacy compatibility - these will be replaced with Firestore equivalents
export default prisma;

