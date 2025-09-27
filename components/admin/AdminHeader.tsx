"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useState } from "react";

interface AdminHeaderProps {
  tenant: any;
  tenantSlug: string;
}

export default function AdminHeader({ tenant, tenantSlug }: AdminHeaderProps) {
  const router = useRouter();
  const { signOutUser } = useFirebaseAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOutUser();
      router.push('/admin/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      router.push('/admin/sign-in');
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={tenant.name || tenantSlug}
                width={32}
                height={32}
                className="rounded"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">
                  {tenantSlug.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tenant.name || tenantSlug} Admin
              </h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Link 
              href={`/${tenantSlug}`}
              className="text-gray-600 hover:text-gray-900"
            >
              View Store
            </Link>
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
