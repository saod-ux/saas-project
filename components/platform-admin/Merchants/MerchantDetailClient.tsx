"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Eye, Settings, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  [key: string]: any;
}

interface HeroSettings {
  enabled: boolean;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface PolicySettings {
  returnPolicy: {
    enabled: boolean;
    title: string;
    content: string;
  };
  aboutUs: {
    enabled: boolean;
    title: string;
    content: string;
  };
}

interface MerchantContentSettings {
  hero: HeroSettings;
  policies: PolicySettings;
  updatedAt: string;
}

interface MerchantDetailClientProps {
  tenant: Tenant;
}

export default function MerchantDetailClient({ tenant }: MerchantDetailClientProps) {
  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
    enabled: false,
    title: "",
    description: "",
    ctaText: "",
    ctaLink: ""
  });

  const [policySettings, setPolicySettings] = useState<PolicySettings>({
    returnPolicy: {
      enabled: false,
      title: "Return & Exchange Policy",
      content: ""
    },
    aboutUs: {
      enabled: false,
      title: "About Us",
      content: ""
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const tenantSlug = tenant.slug || tenant.id; // Fallback to ID if slug is missing
      const response = await fetch(`/api/platform/merchants/${tenantSlug}/content`);
      const data = await response.json();
      
      if (data.ok) {
        setHeroSettings(data.settings.hero);
        setPolicySettings(data.settings.policies);
      } else {
        // Use default settings if no override exists
        setHeroSettings({
          enabled: false,
          title: "Welcome to Our Store",
          description: "Discover amazing products at great prices",
          ctaText: "Shop Now",
          ctaLink: "/categories"
        });

        setPolicySettings({
          returnPolicy: {
            enabled: false,
            title: "Return & Exchange Policy",
            content: "We offer a 30-day return policy for all items in original condition..."
          },
          aboutUs: {
            enabled: false,
            title: "About Us",
            content: "We are a leading online retailer committed to providing quality products and excellent customer service..."
          }
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, [tenant.slug, tenant.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const tenantSlug = tenant.slug || tenant.id; // Fallback to ID if slug is missing
      const response = await fetch(`/api/platform/merchants/${tenantSlug}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hero: heroSettings,
          policies: policySettings,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading merchant content settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/platform/merchants">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Merchants
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
            <p className="text-gray-600">Content Management for {tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${tenant.slug}/retail`} target="_blank">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Storefront
            </Button>
          </Link>
          <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Policies & About
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Hero Settings Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section Override</CardTitle>
              <CardDescription>
                Override the hero section for this merchant's storefront. When disabled, the storefront will show image-only hero.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Enable Hero Override</h3>
                  <p className="text-sm text-gray-600">Override hero section for this merchant only</p>
                </div>
                <Switch
                  checked={heroSettings.enabled}
                  onCheckedChange={(checked) => 
                    setHeroSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {heroSettings.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero Title
                    </label>
                    <Input
                      value={heroSettings.title}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter hero title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hero Description
                    </label>
                    <Textarea
                      value={heroSettings.description}
                      onChange={(e) => setHeroSettings(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter hero description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTA Button Text
                      </label>
                      <Input
                        value={heroSettings.ctaText}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, ctaText: e.target.value }))}
                        placeholder="e.g., Shop Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTA Button Link
                      </label>
                      <Input
                        value={heroSettings.ctaLink}
                        onChange={(e) => setHeroSettings(prev => ({ ...prev, ctaLink: e.target.value }))}
                        placeholder="e.g., /categories"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          {/* Return Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Return & Exchange Policy Override</CardTitle>
              <CardDescription>
                Override the return policy content for this merchant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Enable Return Policy Override</h3>
                  <p className="text-sm text-gray-600">Override return policy for this merchant only</p>
                </div>
                <Switch
                  checked={policySettings.returnPolicy.enabled}
                  onCheckedChange={(checked) => 
                    setPolicySettings(prev => ({
                      ...prev,
                      returnPolicy: { ...prev.returnPolicy, enabled: checked }
                    }))
                  }
                />
              </div>

              {policySettings.returnPolicy.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Title
                    </label>
                    <Input
                      value={policySettings.returnPolicy.title}
                      onChange={(e) => setPolicySettings(prev => ({
                        ...prev,
                        returnPolicy: { ...prev.returnPolicy, title: e.target.value }
                      }))}
                      placeholder="Return & Exchange Policy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Content
                    </label>
                    <Textarea
                      value={policySettings.returnPolicy.content}
                      onChange={(e) => setPolicySettings(prev => ({
                        ...prev,
                        returnPolicy: { ...prev.returnPolicy, content: e.target.value }
                      }))}
                      placeholder="Enter policy content..."
                      rows={8}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* About Us */}
          <Card>
            <CardHeader>
              <CardTitle>About Us Section Override</CardTitle>
              <CardDescription>
                Override the about us content for this merchant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Enable About Us Override</h3>
                  <p className="text-sm text-gray-600">Override about us section for this merchant only</p>
                </div>
                <Switch
                  checked={policySettings.aboutUs.enabled}
                  onCheckedChange={(checked) => 
                    setPolicySettings(prev => ({
                      ...prev,
                      aboutUs: { ...prev.aboutUs, enabled: checked }
                    }))
                  }
                />
              </div>

              {policySettings.aboutUs.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Title
                    </label>
                    <Input
                      value={policySettings.aboutUs.title}
                      onChange={(e) => setPolicySettings(prev => ({
                        ...prev,
                        aboutUs: { ...prev.aboutUs, title: e.target.value }
                      }))}
                      placeholder="About Us"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About Us Content
                    </label>
                    <Textarea
                      value={policySettings.aboutUs.content}
                      onChange={(e) => setPolicySettings(prev => ({
                        ...prev,
                        aboutUs: { ...prev.aboutUs, content: e.target.value }
                      }))}
                      placeholder="Enter about us content..."
                      rows={8}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>
                Preview how the content will appear on {tenant.name}'s storefront
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Hero Preview */}
                {heroSettings.enabled ? (
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-4">{heroSettings.title}</h1>
                      <p className="text-xl mb-8">{heroSettings.description}</p>
                      <a 
                        href={heroSettings.ctaLink}
                        className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                      >
                        {heroSettings.ctaText}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 bg-gray-100">
                    <div className="text-center text-gray-600">
                      <h3 className="text-lg font-medium mb-2">Image-Only Hero</h3>
                      <p className="text-sm">Hero section will show only images without text or CTA button</p>
                    </div>
                  </div>
                )}

                {/* Policies Preview */}
                <div className="space-y-6">
                  {policySettings.returnPolicy.enabled && (
                    <div className="border rounded-lg p-6">
                      <h2 className="text-2xl font-bold mb-4">{policySettings.returnPolicy.title}</h2>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{policySettings.returnPolicy.content}</p>
                      </div>
                    </div>
                  )}

                  {policySettings.aboutUs.enabled && (
                    <div className="border rounded-lg p-6">
                      <h2 className="text-2xl font-bold mb-4">{policySettings.aboutUs.title}</h2>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{policySettings.aboutUs.content}</p>
                      </div>
                    </div>
                  )}

                  {!policySettings.returnPolicy.enabled && !policySettings.aboutUs.enabled && (
                    <div className="border rounded-lg p-6 bg-gray-100">
                      <div className="text-center text-gray-600">
                        <h3 className="text-lg font-medium mb-2">No Policy Overrides</h3>
                        <p className="text-sm">Policy and About Us sections will not be shown on the storefront</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
