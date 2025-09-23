"use client";

import { useState } from "react";
import MerchantsTable from "@/components/platform-admin/Merchants/MerchantsTable";
import CreateMerchantButton from "@/components/platform-admin/Merchants/CreateMerchantButton";
import { PageHelp } from "@/components/admin/PageHelp";

export default function MerchantsPageClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMerchantCreated = (data: any) => {
    // Trigger a refresh of the merchants table
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-gray-600">Manage all merchants on your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <PageHelp pageKey="platform.merchants" locale="en" />
          <CreateMerchantButton onSuccess={handleMerchantCreated} />
        </div>
      </div>

      <MerchantsTable key={refreshKey} />
    </div>
  );
}
