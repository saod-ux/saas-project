import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

interface LowStockProduct {
  id: string;
  title: string;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
}

interface LowStockAlertProps {
  products: LowStockProduct[];
  tenantSlug: string;
  locale?: string;
}

export async function LowStockAlert({ products, tenantSlug, locale = "en" }: LowStockAlertProps) {
  const t = await getTranslations(locale);

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>All products are well stocked</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alert
          <Badge variant="destructive" className="ml-auto">
            {products.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{product.title}</div>
                  <div className="text-sm text-gray-500">
                    Stock: {product.stock} / {product.lowStockThreshold}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={product.stock === 0 ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                </Badge>
                <Link href={`/admin/${tenantSlug}/products/${product.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


