"use client";

import Link from "next/link";
import { Plus, Store, Globe, Users, Settings } from "lucide-react";

const actions = [
  {
    title: "Create New Merchant",
    description: "Add a new store to the platform",
    href: "/admin/platform/merchants/new",
    icon: Plus,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    title: "Verify Domains",
    description: "Check domain verification status",
    href: "/admin/platform/domains",
    icon: Globe,
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    title: "Manage Users",
    description: "View and manage platform users",
    href: "/admin/platform/users",
    icon: Users,
    color: "bg-purple-500 hover:bg-purple-600"
  },
  {
    title: "Platform Settings",
    description: "Configure global settings",
    href: "/admin/platform/settings",
    icon: Settings,
    color: "bg-gray-500 hover:bg-gray-600"
  }
];

export default function QuickActions() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg text-white ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


