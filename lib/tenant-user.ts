/**
 * TenantUser management utilities
 * Provides functions for creating, finding, and managing tenant-scoped users
 */

import { 
  getTenantUserByEmail as firestoreGetTenantUserByEmail, 
  getTenantUserById as firestoreGetTenantUserById, 
  createTenantUser as firestoreCreateTenantUser, 
  updateTenantUser as firestoreUpdateTenantUser, 
  getTenantUsers as firestoreGetTenantUsers, 
  deleteTenantUser as firestoreDeleteTenantUser 
} from './firebase/tenant'

export interface TenantUserData {
  id: string
  tenantId: string
  userId?: string | null
  email: string
  phone?: string | null
  name?: string | null
  firebaseUid?: string | null
  isGuest: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateTenantUserData {
  tenantId: string
  userId?: string
  email: string
  phone?: string
  name?: string
  firebaseUid?: string
  isGuest?: boolean
}

/**
 * Create a new TenantUser
 */
export async function createTenantUser(data: CreateTenantUserData): Promise<TenantUserData | null> {
  try {
    const tenantUser = await firestoreCreateTenantUser(data.tenantId, {
      userId: data.userId || null,
      email: data.email,
      phone: data.phone || null,
      name: data.name || null,
      firebaseUid: data.firebaseUid || null,
      isGuest: data.isGuest || false
    })

    return tenantUser
  } catch (error) {
    console.error('Error creating TenantUser:', error)
    return null
  }
}

/**
 * Find TenantUser by tenant and email
 */
export async function findTenantUserByEmail(
  tenantId: string, 
  email: string
): Promise<TenantUserData | null> {
  try {
    const tenantUser = await firestoreGetTenantUserByEmail(tenantId, email)
    return tenantUser
  } catch (error) {
    console.error('Error finding TenantUser by email:', error)
    return null
  }
}

/**
 * Find TenantUser by tenant and global user ID
 */
export async function findTenantUserByGlobalUserId(
  tenantId: string, 
  userId: string
): Promise<TenantUserData | null> {
  try {
    // For Firestore, we need to query by tenantId and userId
    const users = await firestoreGetTenantUsers(tenantId)
    const tenantUser = users.find((user: any) => user.userId === userId)
    return tenantUser || null
  } catch (error) {
    console.error('Error finding TenantUser by global user ID:', error)
    return null
  }
}

/**
 * Find or create TenantUser for a customer
 * This is useful for guest checkout scenarios
 */
export async function findOrCreateTenantUser(
  tenantId: string,
  email: string,
  options: {
    name?: string
    phone?: string
    firebaseUid?: string
    isGuest?: boolean
  } = {}
): Promise<TenantUserData | null> {
  try {
    // First, try to find existing TenantUser
    let tenantUser = await findTenantUserByEmail(tenantId, email)
    
    if (tenantUser) {
      return tenantUser
    }

    // Create new TenantUser
    tenantUser = await createTenantUser({
      tenantId,
      email,
      name: options.name,
      phone: options.phone,
      firebaseUid: options.firebaseUid,
      isGuest: options.isGuest || true
    })

    return tenantUser
  } catch (error) {
    console.error('Error finding or creating TenantUser:', error)
    return null
  }
}

/**
 * Get TenantUser by ID (with tenant validation)
 */
export async function getTenantUserById(
  tenantId: string,
  tenantUserId: string
): Promise<TenantUserData | null> {
  try {
    const tenantUser = await firestoreGetTenantUserById(tenantId, tenantUserId)
    return tenantUser
  } catch (error) {
    console.error('Error getting TenantUser by ID:', error)
    return null
  }
}

/**
 * Update TenantUser
 */
export async function updateTenantUser(
  tenantId: string,
  tenantUserId: string,
  data: Partial<CreateTenantUserData>
): Promise<TenantUserData | null> {
  try {
    const updateData = {
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.firebaseUid !== undefined && { firebaseUid: data.firebaseUid }),
      ...(data.isGuest !== undefined && { isGuest: data.isGuest })
    }
    
    await firestoreUpdateTenantUser(tenantId, tenantUserId, updateData)
    // Return the updated user by fetching it
    return await getTenantUserById(tenantId, tenantUserId)
  } catch (error) {
    console.error('Error updating TenantUser:', error)
    return null
  }
}

/**
 * Link TenantUser to global User
 * This is useful when a guest user registers
 */
export async function linkTenantUserToGlobalUser(
  tenantId: string,
  tenantUserId: string,
  globalUserId: string
): Promise<TenantUserData | null> {
  try {
    await firestoreUpdateTenantUser(tenantId, tenantUserId, {
      userId: globalUserId,
      isGuest: false
    })

    return await getTenantUserById(tenantId, tenantUserId)
  } catch (error) {
    console.error('Error linking TenantUser to global user:', error)
    return null
  }
}

/**
 * Get all TenantUsers for a tenant (with pagination)
 */
export async function getTenantUsers(
  tenantId: string,
  options: {
    page?: number
    limit?: number
    search?: string
  } = {}
): Promise<{
  users: TenantUserData[]
  total: number
  page: number
  limit: number
  pages: number
}> {
  try {
    const { page = 1, limit = 20, search } = options
    
    // Get all users for the tenant
    let users = await firestoreGetTenantUsers(tenantId)
    
    // Apply search filter if provided
    if (search) {
      users = users.filter((user: any) => 
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(search.toLowerCase()))
      )
    }
    
    const total = users.length
    const skip = (page - 1) * limit
    const paginatedUsers = users.slice(skip, skip + limit)

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  } catch (error) {
    console.error('Error getting TenantUsers:', error)
    return {
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      pages: 0
    }
  }
}

/**
 * Delete TenantUser (soft delete by marking as guest)
 */
export async function deleteTenantUser(
  tenantId: string,
  tenantUserId: string
): Promise<boolean> {
  try {
    // For Firestore, we'll do a soft delete by marking as guest
    await firestoreUpdateTenantUser(tenantId, tenantUserId, {
      isGuest: true,
      userId: null // Unlink from global user
    })

    return true
  } catch (error) {
    console.error('Error deleting TenantUser:', error)
    return false
  }
}

