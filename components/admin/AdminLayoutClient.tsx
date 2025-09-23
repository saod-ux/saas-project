"use client";

import { useEffect, useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { Menu, X } from 'lucide-react';

interface AdminLayoutClientProps {
  tenantSlug: string;
  tenantName: string;
  logoUrl?: string | null;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ tenantSlug, tenantName, logoUrl, children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveLogoUrl, setLiveLogoUrl] = useState<string | null | undefined>(logoUrl);

  // Always fetch fresh appearance to keep sidebar logo in sync after refresh
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/${tenantSlug}/appearance`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const latest = json?.appearance?.logoUrl ?? null;
        if (isMounted) setLiveLogoUrl(latest);
      } catch (_) {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, [tenantSlug]);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{tenantName.slice(0, 2).toUpperCase()}</span>
          </div>
          <span className="font-semibold text-gray-900">{tenantName}</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:block`}>
        <AdminNavigation tenantSlug={tenantSlug} tenantName={tenantName} logoUrl={liveLogoUrl ?? logoUrl} />
      </div>
      
      {/* Main Content Area */}
      <main className="ml-0 md:ml-64 min-h-screen transition-all duration-300 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
