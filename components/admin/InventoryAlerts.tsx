'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  acknowledged: boolean;
}

interface InventoryAlertsProps {
  tenantSlug: string;
}

export default function InventoryAlerts({ tenantSlug }: InventoryAlertsProps) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/inventory/alerts`);
      const data = await response.json();
      
      if (data.ok) {
        setAlerts(data.data);
      } else {
        toast.error('Failed to fetch inventory alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const refreshAlerts = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/inventory/alerts`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.ok) {
        toast.success(data.message);
        await fetchAlerts();
      } else {
        toast.error('Failed to refresh alerts');
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      toast.error('Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/inventory/alerts/${alertId}/acknowledge`, {
        method: 'PATCH'
      });
      const data = await response.json();
      
      if (data.ok) {
        toast.success('Alert acknowledged');
        await fetchAlerts();
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [tenantSlug]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'OUT_OF_STOCK': return <Package className="h-4 w-4" />;
      case 'LOW_STOCK': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
          <CardDescription>Loading inventory alerts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              {unacknowledgedAlerts.length} unacknowledged alerts
            </CardDescription>
          </div>
          <Button 
            onClick={refreshAlerts} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {unacknowledgedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No unacknowledged alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unacknowledgedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)} text-white`}>
                    {getAlertIcon(alert.alertType)}
                  </div>
                  <div>
                    <h4 className="font-medium">{alert.productName}</h4>
                    <p className="text-sm text-gray-600">
                      {alert.alertType === 'OUT_OF_STOCK' 
                        ? 'Out of stock' 
                        : `Low stock: ${alert.currentStock} remaining (threshold: ${alert.threshold})`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                  <Button
                    onClick={() => acknowledgeAlert(alert.id)}
                    size="sm"
                    variant="outline"
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {acknowledgedAlerts.length > 0 && (
          <div className="mt-8">
            <h3 className="font-medium mb-4">Recently Acknowledged</h3>
            <div className="space-y-2">
              {acknowledgedAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{alert.productName}</p>
                      <p className="text-xs text-gray-600">
                        {alert.alertType === 'OUT_OF_STOCK' 
                          ? 'Out of stock' 
                          : `Low stock: ${alert.currentStock} remaining`
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Acknowledged
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

