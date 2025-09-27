"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, ShoppingBag, Package, LogOut } from "lucide-react";
import Link from "next/link";

interface CustomerAccountClientProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  tenantSlug: string;
}

export default function CustomerAccountClient({ tenant, tenantSlug }: CustomerAccountClientProps) {
  const { language, isHydrated } = useLanguage();
  const [isClientHydrated, setIsClientHydrated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClientHydrated(true);
    // Simulate loading customer data
    setTimeout(() => {
      setCustomerData({
        name: "John Doe",
        email: "customer@test.com",
        phone: "+965 1234 5678",
        address: "Kuwait City, Kuwait",
        ordersCount: 3,
        totalSpent: 125.50
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    // Clear all customer auth cookies
    const cookiesToClear = ['customer_token', 'customer_id', 'customer_email', 'tenant_id', 'tenant_slug'];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Redirect to home page
    window.location.href = `/${tenantSlug}`;
  };

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'my_account': { ar: 'حسابي', en: 'My Account' },
      'personal_info': { ar: 'المعلومات الشخصية', en: 'Personal Information' },
      'order_history': { ar: 'تاريخ الطلبات', en: 'Order History' },
      'account_settings': { ar: 'إعدادات الحساب', en: 'Account Settings' },
      'full_name': { ar: 'الاسم الكامل', en: 'Full Name' },
      'email_address': { ar: 'البريد الإلكتروني', en: 'Email Address' },
      'phone_number': { ar: 'رقم الهاتف', en: 'Phone Number' },
      'address': { ar: 'العنوان', en: 'Address' },
      'save_changes': { ar: 'حفظ التغييرات', en: 'Save Changes' },
      'recent_orders': { ar: 'الطلبات الأخيرة', en: 'Recent Orders' },
      'view_all_orders': { ar: 'عرض جميع الطلبات', en: 'View All Orders' },
      'no_orders_yet': { ar: 'لا توجد طلبات بعد', en: 'No orders yet' },
      'start_shopping': { ar: 'ابدأ التسوق', en: 'Start Shopping' },
      'total_orders': { ar: 'إجمالي الطلبات', en: 'Total Orders' },
      'total_spent': { ar: 'إجمالي المبلغ المنفق', en: 'Total Spent' },
      'logout': { ar: 'تسجيل الخروج', en: 'Logout' },
      'edit_profile': { ar: 'تعديل الملف الشخصي', en: 'Edit Profile' },
    };
    return translations[key]?.[language] || key;
  };

  // Prevent hydration mismatch
  if (!isClientHydrated || !isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('my_account')}</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('my_account')}</h1>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('my_account')}</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Manage your account and view your order history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('personal_info')}
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('full_name')}</Label>
                  <Input
                    id="name"
                    value={customerData?.name || ''}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('email_address')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData?.email || ''}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('phone_number')}</Label>
                  <Input
                    id="phone"
                    value={customerData?.phone || ''}
                    readOnly
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">{t('address')}</Label>
                  <Input
                    id="address"
                    value={customerData?.address || ''}
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  {t('edit_profile')}
                </Button>
                <Button variant="outline" size="sm">
                  {t('save_changes')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t('recent_orders')}
              </CardTitle>
              <CardDescription>
                View your recent orders and their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerData?.ordersCount > 0 ? (
                <div className="space-y-4">
                  {/* Mock recent orders */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #12345</p>
                        <p className="text-sm text-gray-600">Placed on Dec 15, 2024</p>
                      </div>
                      <Badge variant="outline">Delivered</Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">2 items • 45.50 KWD</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #12344</p>
                        <p className="text-sm text-gray-600">Placed on Dec 10, 2024</p>
                      </div>
                      <Badge variant="outline">Shipped</Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">1 item • 25.00 KWD</p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    {t('view_all_orders')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">{t('no_orders_yet')}</p>
                  <Link href={`/${tenantSlug}`}>
                    <Button>
                      {t('start_shopping')}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('total_orders')}</span>
                <span className="font-medium">{customerData?.ordersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('total_spent')}</span>
                <span className="font-medium">{customerData?.totalSpent || 0} KWD</span>
              </div>
              <Separator />
              <div className="text-center">
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/${tenantSlug}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Link href={`/${tenantSlug}/cart`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  View Cart
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
