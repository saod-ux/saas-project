'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

interface InventorySummary {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  recentMovements: number;
}

interface InventorySummaryProps {
  tenantSlug: string;
}

export default function InventorySummary({ tenantSlug }: InventorySummaryProps) {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/admin/${tenantSlug}/inventory/summary`);
        const data = await response.json();
        
        if (data.ok) {
          setSummary(data.data);
        }
      } catch (error) {
        console.error('Error fetching inventory summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load inventory summary</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Products',
      value: summary.totalProducts,
      icon: Package,
      description: 'Products with inventory tracking',
      color: 'text-blue-600'
    },
    {
      title: 'Low Stock',
      value: summary.lowStockProducts,
      icon: AlertTriangle,
      description: 'Products below threshold',
      color: 'text-yellow-600'
    },
    {
      title: 'Out of Stock',
      value: summary.outOfStockProducts,
      icon: Package,
      description: 'Products with zero stock',
      color: 'text-red-600'
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(summary.totalValue),
      icon: DollarSign,
      description: 'Total inventory value',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Stock movements in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-2xl font-bold">{summary.recentMovements}</span>
            <span className="text-sm text-muted-foreground">movements</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

