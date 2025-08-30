'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Instagram, Facebook, Twitter, MessageCircle, Music, Globe, Palette, Store, CreditCard, Monitor } from 'lucide-react'
import PaymentSettings from './payment-settings'
import StorefrontSettings from './storefront-settings'

interface TenantSettings {
  storeName: string
  description: string
  socialLinks: {
    instagram?: string
    facebook?: string
    twitter?: string
    whatsapp?: string
    tiktok?: string
    website?: string
  }
  branding: {
    primaryColor?: string
    logo?: string
    favicon?: string
  }
  categories: string[]
  contactInfo: {
    email?: string
    phone?: string
    address?: string
  }
  // Payment settings (these come from the tenant model directly)
  myfatoorahApiKey?: string
  myfatoorahSecretKey?: string
  myfatoorahIsTest?: boolean
  knetMerchantId?: string
  knetApiKey?: string
  knetIsTest?: boolean
  stripePublishableKey?: string
  stripeSecretKey?: string
  stripeIsTest?: boolean
  // Storefront theme settings
  primary?: string
  accent?: string
  bg?: string
  card?: string
  text?: string
  logoUrl?: string
  showHero?: boolean
  heroTitle?: string
  heroSubtitle?: string
  heroCtaLabel?: string
  heroCtaHref?: string
  heroImageUrl?: string
  direction?: 'ltr' | 'rtl'
  locale?: 'en-US' | 'ar-KW'
}

// Extract tenant slug from hostname
function extractTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname.toLowerCase()
  const parts = hostname.split('.')
  
  const isLocalhost = parts.includes('localhost')
  if (isLocalhost && parts.length >= 2) {
    return parts[0] || null
  }
  
  return null
}

export default function SettingsPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [settings, setSettings] = useState<TenantSettings>({
    storeName: '',
    description: '',
    socialLinks: {},
    branding: {},
    categories: [],
    contactInfo: {},
    // Initialize payment settings with defaults
    myfatoorahApiKey: '',
    myfatoorahSecretKey: '',
    myfatoorahIsTest: true,
    knetMerchantId: '',
    knetApiKey: '',
    knetIsTest: true,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeIsTest: true,
    // Storefront theme defaults
    primary: '#1F2937',
    accent: '#111827',
    bg: '#FAF7F2',
    card: '#FFFFFF',
    text: '#1F2937',
    showHero: true,
    heroTitle: 'Welcome to Our Store',
    heroSubtitle: 'Discover amazing products at great prices',
    heroCtaLabel: 'Shop Now',
    heroCtaHref: '#products',
    direction: 'ltr',
    locale: 'en-US'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get tenant slug on mount
  useEffect(() => {
    const slug = extractTenantSlug()
    setTenantSlug(slug)
  }, [])

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in'
    }
  }, [isLoaded, isSignedIn])

  async function loadSettings() {
    if (!tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/settings', {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (res.ok) {
        // Merge the data with our default structure
        const tenantData = json.data
        setSettings({
          storeName: tenantData.storeName || tenantSlug.toUpperCase(),
          description: tenantData.description || '',
          socialLinks: tenantData.socialLinks || {},
          branding: tenantData.branding || {},
          categories: tenantData.categories || [],
          contactInfo: tenantData.contactInfo || {},
          // Payment settings from tenant model
          myfatoorahApiKey: tenantData.myfatoorahApiKey || '',
          myfatoorahSecretKey: tenantData.myfatoorahSecretKey || '',
          myfatoorahIsTest: tenantData.myfatoorahIsTest ?? true,
          knetMerchantId: tenantData.knetMerchantId || '',
          knetApiKey: tenantData.knetApiKey || '',
          knetIsTest: tenantData.knetIsTest ?? true,
          stripePublishableKey: tenantData.stripePublishableKey || '',
          stripeSecretKey: tenantData.stripeSecretKey || '',
          stripeIsTest: tenantData.stripeIsTest ?? true,
          // Storefront theme settings
          primary: tenantData.primary || '#1F2937',
          accent: tenantData.accent || '#111827',
          bg: tenantData.bg || '#FAF7F2',
          card: tenantData.card || '#FFFFFF',
          text: tenantData.text || '#1F2937',
          logoUrl: tenantData.logoUrl,
          showHero: tenantData.showHero ?? true,
          heroTitle: tenantData.heroTitle || 'Welcome to Our Store',
          heroSubtitle: tenantData.heroSubtitle || 'Discover amazing products at great prices',
          heroCtaLabel: tenantData.heroCtaLabel || 'Shop Now',
          heroCtaHref: tenantData.heroCtaHref || '#products',
          heroImageUrl: tenantData.heroImageUrl,
          direction: tenantData.direction || 'ltr',
          locale: tenantData.locale || 'en-US'
        })
      } else {
        // Initialize with default settings if none exist
        setSettings({
          storeName: tenantSlug.toUpperCase(),
          description: '',
          socialLinks: {},
          branding: {},
          categories: [],
          contactInfo: {},
          // Payment settings defaults
          myfatoorahApiKey: '',
          myfatoorahSecretKey: '',
          myfatoorahIsTest: true,
          knetMerchantId: '',
          knetApiKey: '',
          knetIsTest: true,
          stripePublishableKey: '',
          stripeSecretKey: '',
          stripeIsTest: true,
          // Storefront theme defaults
          primary: '#1F2937',
          accent: '#111827',
          bg: '#FAF7F2',
          card: '#FFFFFF',
          text: '#1F2937',
          showHero: true,
          heroTitle: 'Welcome to Our Store',
          heroSubtitle: 'Discover amazing products at great prices',
          heroCtaLabel: 'Shop Now',
          heroCtaHref: '#products',
          direction: 'ltr',
          locale: 'en-US'
        })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      loadSettings()
    }
  }, [isSignedIn, tenantSlug])

  async function saveSettings() {
    if (!isSignedIn || !tenantSlug) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(settings)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to save settings')
      }
      
      alert('Settings saved successfully!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  function updateSettings(path: string, value: any) {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  function addCategory() {
    const newCategory = prompt('Enter category name:')
    if (newCategory && newCategory.trim()) {
      updateSettings('categories', [...settings.categories, newCategory.trim()])
    }
  }

  function removeCategory(index: number) {
    updateSettings('categories', settings.categories.filter((_, i) => i !== index))
  }

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>
  }

  if (!isSignedIn) {
    return <div className="p-6">Redirecting to sign in...</div>
  }

  if (!tenantSlug) {
    return <div className="p-6">No tenant found. Please access via subdomain like acme.localhost:3002</div>
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <Button onClick={() => window.location.href = '/admin/products'}>
            Back to Products
          </Button>
        </div>

        {loading ? (
          <p>Loading settings...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Social Media
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="storefront" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Storefront
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                  <CardDescription>
                    Basic information about your store that appears on the storefront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={settings.storeName}
                      onChange={(e) => updateSettings('storeName', e.target.value)}
                      placeholder="Your Store Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Store Description</Label>
                    <Textarea
                      id="description"
                      value={settings.description}
                      onChange={(e) => updateSettings('description', e.target.value)}
                      placeholder="Tell customers about your store..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.contactInfo?.email || ''}
                      onChange={(e) => updateSettings('contactInfo.email', e.target.value)}
                      placeholder="contact@yourstore.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      value={settings.contactInfo?.phone || ''}
                      onChange={(e) => updateSettings('contactInfo.phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={settings.contactInfo?.address || ''}
                      onChange={(e) => updateSettings('contactInfo.address', e.target.value)}
                      placeholder="Your business address..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Settings */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>
                    Add your social media profiles to appear on your storefront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-pink-600" />
                    <div className="flex-1">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={settings.socialLinks?.instagram || ''}
                        onChange={(e) => updateSettings('socialLinks.instagram', e.target.value)}
                        placeholder="https://instagram.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={settings.socialLinks?.facebook || ''}
                        onChange={(e) => updateSettings('socialLinks.facebook', e.target.value)}
                        placeholder="https://facebook.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        value={settings.socialLinks?.twitter || ''}
                        onChange={(e) => updateSettings('socialLinks.twitter', e.target.value)}
                        placeholder="https://twitter.com/yourstore"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={settings.socialLinks?.whatsapp || ''}
                        onChange={(e) => updateSettings('socialLinks.whatsapp', e.target.value)}
                        placeholder="https://wa.me/1234567890"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-black" />
                    <div className="flex-1">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={settings.socialLinks?.tiktok || ''}
                        onChange={(e) => updateSettings('socialLinks.tiktok', e.target.value)}
                        placeholder="https://tiktok.com/@yourstore"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={settings.socialLinks?.website || ''}
                        onChange={(e) => updateSettings('socialLinks.website', e.target.value)}
                        placeholder="https://yourstore.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Settings */}
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Branding & Design</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your store.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primaryColor"
                        value={settings.branding?.primaryColor || ''}
                        onChange={(e) => updateSettings('branding.primaryColor', e.target.value)}
                        placeholder="#3B82F6"
                      />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: settings.branding?.primaryColor || '#3B82F6' }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                                              value={settings.branding?.logo || ''}
                      onChange={(e) => updateSettings('branding.logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="favicon">Favicon URL</Label>
                    <Input
                      id="favicon"
                                              value={settings.branding?.favicon || ''}
                      onChange={(e) => updateSettings('branding.favicon', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Settings */}
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>
                    Organize your products into categories for better navigation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button onClick={addCategory} size="sm">
                      Add Category
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {settings.categories?.map((category, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1">{category}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCategory(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    
                    {(!settings.categories || settings.categories.length === 0) && (
                      <p className="text-gray-500 text-sm">No categories added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payment" className="space-y-6">
              <PaymentSettings />
            </TabsContent>

            {/* Storefront Settings */}
            <TabsContent value="storefront" className="space-y-6">
              <StorefrontSettings
                settings={{
                  primary: settings.primary || '#1F2937',
                  accent: settings.accent || '#111827',
                  bg: settings.bg || '#FAF7F2',
                  card: settings.card || '#FFFFFF',
                  text: settings.text || '#1F2937',
                  logoUrl: settings.logoUrl,
                  showHero: settings.showHero ?? true,
                  heroTitle: settings.heroTitle || 'Welcome to Our Store',
                  heroSubtitle: settings.heroSubtitle || 'Discover amazing products at great prices',
                  heroCtaLabel: settings.heroCtaLabel || 'Shop Now',
                  heroCtaHref: settings.heroCtaHref || '#products',
                  heroImageUrl: settings.heroImageUrl,
                  direction: settings.direction || 'ltr',
                  locale: settings.locale || 'en-US',
                }}
                onUpdate={(updates) => {
                  Object.entries(updates).forEach(([key, value]) => {
                    updateSettings(key as any, value)
                  })
                }}
                onSave={saveSettings}
                saving={saving}
              />
            </TabsContent>
          </Tabs>

          {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
