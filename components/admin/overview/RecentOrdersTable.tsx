"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations } from "@/lib/i18n";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
  createdAt: string;
}

interface RecentOrdersTableProps {
  orders: Order[];
  tenantSlug: string;
  locale?: string;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function RecentOrdersTable({ orders, tenantSlug, locale = "en" }: RecentOrdersTableProps) {
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const router = useRouter();

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KW", {
      style: "currency",
      currency: "KWD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-KW" : "en-US");
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No recent orders
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Order</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-3">
                    <div className="font-medium">#{order.orderNumber}</div>
                  </td>
                  <td className="py-3">
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      {order.customerEmail && (
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={updatingOrders.has(order.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(statusLabels).map(([status, label]) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            disabled={order.status === status || updatingOrders.has(order.id)}
                          >
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


