import { ReactNode } from "react";
import PlatformSidebar from "@/components/platform-admin/PlatformSidebar";
import PlatformHeader from "@/components/platform-admin/PlatformHeader";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  // Authentication is handled by middleware or individual pages
  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformHeader />
      <div className="flex">
        <PlatformSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}