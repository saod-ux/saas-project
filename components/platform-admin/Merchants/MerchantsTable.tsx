"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Settings, Globe, Users, Calendar, MoreHorizontal, Play, Pause, Archive, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import TenantLifecycleManager from "@/components/platform-admin/Tenants/TenantLifecycleManager";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  template: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    orders: number;
    memberships: number;
  };
}

export default function MerchantsTable() {
  const [merchants, setMerchants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/platform/tenants?limit=20', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.ok) {
        setMerchants(data.data);
      } else {
        console.error('Error fetching merchants:', data.error);
        toast.error('Failed to load merchants');
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantCreated = (newMerchant: Tenant) => {
    setMerchants(prev => [newMerchant, ...prev]);
    fetchMerchants(); // Re-fetch to get updated data
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="text-center">Loading merchants...</div>
        </div>
      </div>
    );
  }

  return (
    <TenantLifecycleManager 
      tenants={merchants} 
      onRefresh={fetchMerchants}
      onMerchantCreated={handleMerchantCreated}
    />
  );
}
