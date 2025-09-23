import { createTenantUser } from "@/lib/firebase/tenant-user";

export async function ensureDevSuperAdmin(args: { userId: string; email: string | null }) {
  if (process.env.NODE_ENV !== "development") return;
  const target = process.env.DEV_SUPER_ADMIN_EMAIL?.toLowerCase();
  const email = args.email?.toLowerCase() ?? null;
  if (!target || !email || email !== target) return;

  try {
    // For Firestore, we'll create a platform admin user
    // This is a simplified version - in a real app, you'd have a proper platform admin collection
    console.log('Dev super admin ensured for:', email);
    
    // You can add Firestore operations here to create platform admin records
    // For now, we'll just log that the user is a dev super admin
    console.log('Dev super admin user ID:', args.userId);
  } catch (error) {
    console.error('Error ensuring dev super admin:', error);
  }
}