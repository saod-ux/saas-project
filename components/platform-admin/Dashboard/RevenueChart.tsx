"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data - replace with actual revenue data
const revenueData = [
  { month: "Jan", revenue: 12000, merchants: 45 },
  { month: "Feb", revenue: 15000, merchants: 52 },
  { month: "Mar", revenue: 18000, merchants: 58 },
  { month: "Apr", revenue: 22000, merchants: 65 },
  { month: "May", revenue: 25000, merchants: 72 },
  { month: "Jun", revenue: 28000, merchants: 78 },
];

export default function RevenueChart() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue & Growth</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Merchants</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => [
                name === "revenue" ? `$${value.toLocaleString()}` : value,
                name === "revenue" ? "Revenue" : "Merchants"
              ]}
            />
            <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="merchants" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">$28,000</p>
          <p className="text-sm text-gray-600">This Month</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">78</p>
          <p className="text-sm text-gray-600">Active Merchants</p>
        </div>
      </div>
    </div>
  );
}


