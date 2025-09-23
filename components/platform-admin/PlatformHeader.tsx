"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminUserMenu from "./AdminUserMenu";

export default function PlatformHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/platform" className="text-xl font-bold text-gray-900">
            Platform Admin
          </Link>
          <div className="text-sm text-gray-500">
            Multi-tenant SaaS Management
          </div>
        </div>
        
        <div className="ml-auto">
          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
}

