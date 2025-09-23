import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, Settings } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

interface QuickActionsProps {
  tenantSlug: string;
  locale?: string;
}

export async function QuickActions({ tenantSlug, locale = "en" }: QuickActionsProps) {
  const t = await getTranslations(locale);
  
  const actions = [
    {
      title: t("admin.dashboard.quick.addProduct"),
      href: `/admin/${tenantSlug}/products/new`,
      icon: <Plus className="h-4 w-4" />,
      description: "Add a new product to your store"
    },
    {
      title: t("admin.dashboard.quick.viewOrders"),
      href: `/admin/${tenantSlug}/orders`,
      icon: <ShoppingCart className="h-4 w-4" />,
      description: "View and manage orders"
    },
    {
      title: t("admin.dashboard.quick.settings"),
      href: `/admin/${tenantSlug}/settings`,
      icon: <Settings className="h-4 w-4" />,
      description: "Configure store settings"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center space-x-3">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


