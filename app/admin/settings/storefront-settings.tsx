'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, Image, Globe, Eye, Bug } from 'lucide-react'

interface StorefrontSettings {
  // Theme
  primary: string
  accent: string
  bg: string
  card: string
  text: string
  logoUrl?: string
  
  // Hero
  showHero: boolean
  heroTitle: string
  heroSubtitle: string
  heroCtaLabel: string
  heroCtaHref: string
  heroImageUrl?: string
  
  // Direction
  direction: 'ltr' | 'rtl'
  locale: 'en-US' | 'ar-KW'
}

interface Props {
  settings: StorefrontSettings
  onUpdate: (settings: Partial<StorefrontSettings>) => void
  onSave: () => Promise<void>
  saving: boolean
}

export default function StorefrontSettings({ settings, onUpdate, onSave, saving }: Props) {
  const [previewMode, setPreviewMode] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const updateSetting = (key: keyof StorefrontSettings, value: any) => {
    onUpdate({ [key]: value })
  }

  const revalidateStorefront = async () => {
    try {
      const response = await fetch('/api/v1/settings/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        alert('Storefront revalidated successfully!')
      } else {
        alert('Failed to revalidate storefront')
      }
    } catch (error) {
      alert('Error revalidating storefront')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Storefront Settings</h2>
          <p className="text-sm text-gray-600">
            Customize the appearance and content of your customer-facing storefront
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDebugMode(!debugMode)}
            className="flex items-center gap-2"
          >
            <Bug className="h-4 w-4" />
            {debugMode ? 'Hide Debug' : 'Debug'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Bug className="h-4 w-4" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Settings Version:</strong> 1
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date().toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={revalidateStorefront}
              >
                Revalidate Storefront
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('Current settings:', settings)
                  alert('Settings logged to console')
                }}
              >
                Log Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Hero Section
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Localization
          </TabsTrigger>
        </TabsList>

        {/* Theme Settings */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize the colors used throughout your storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="primary"
                      type="color"
                      value={settings.primary}
                      onChange={(e) => updateSetting('primary', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.primary}
                      onChange={(e) => updateSetting('primary', e.target.value)}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="accent"
                      type="color"
                      value={settings.accent}
                      onChange={(e) => updateSetting('accent', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.accent}
                      onChange={(e) => updateSetting('accent', e.target.value)}
                      placeholder="#111827"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bg">Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="bg"
                      type="color"
                      value={settings.bg}
                      onChange={(e) => updateSetting('bg', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.bg}
                      onChange={(e) => updateSetting('bg', e.target.value)}
                      placeholder="#FAF7F2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="card">Card Background</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="card"
                      type="color"
                      value={settings.card}
                      onChange={(e) => updateSetting('card', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.card}
                      onChange={(e) => updateSetting('card', e.target.value)}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="text">Text Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="text"
                      type="color"
                      value={settings.text}
                      onChange={(e) => updateSetting('text', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.text}
                      onChange={(e) => updateSetting('text', e.target.value)}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl || ''}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: URL to your store logo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Settings */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>
                Configure the main banner section at the top of your storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showHero">Show Hero Section</Label>
                  <p className="text-sm text-gray-500">
                    Display the hero banner on your storefront
                  </p>
                </div>
                <Switch
                  id="showHero"
                  checked={settings.showHero}
                  onCheckedChange={(checked) => updateSetting('showHero', checked)}
                />
              </div>

              {settings.showHero && (
                <>
                  <div>
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={settings.heroTitle}
                      onChange={(e) => updateSetting('heroTitle', e.target.value)}
                      placeholder="Welcome to Our Store"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                    <Textarea
                      id="heroSubtitle"
                      value={settings.heroSubtitle}
                      onChange={(e) => updateSetting('heroSubtitle', e.target.value)}
                      placeholder="Discover amazing products at great prices"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="heroCtaLabel">Call-to-Action Label</Label>
                      <Input
                        id="heroCtaLabel"
                        value={settings.heroCtaLabel}
                        onChange={(e) => updateSetting('heroCtaLabel', e.target.value)}
                        placeholder="Shop Now"
                      />
                    </div>

                    <div>
                      <Label htmlFor="heroCtaHref">Call-to-Action Link</Label>
                      <Input
                        id="heroCtaHref"
                        value={settings.heroCtaHref}
                        onChange={(e) => updateSetting('heroCtaHref', e.target.value)}
                        placeholder="#products or /category/electronics"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="heroImageUrl">Hero Background Image URL</Label>
                    <Input
                      id="heroImageUrl"
                      value={settings.heroImageUrl || ''}
                      onChange={(e) => updateSetting('heroImageUrl', e.target.value)}
                      placeholder="https://example.com/hero-image.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Background image for the hero section
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization Settings */}
        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Language & Direction</CardTitle>
              <CardDescription>
                Configure language and text direction for your storefront
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="locale">Language</Label>
                <select
                  id="locale"
                  value={settings.locale}
                  onChange={(e) => updateSetting('locale', e.target.value as 'en-US' | 'ar-KW')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en-US">English (US)</option>
                  <option value="ar-KW">العربية (Kuwait)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="direction">Text Direction</Label>
                <select
                  id="direction"
                  value={settings.direction}
                  onChange={(e) => updateSetting('direction', e.target.value as 'ltr' | 'rtl')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ltr">Left to Right (LTR)</option>
                  <option value="rtl">Right to Left (RTL)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Preview of how your storefront will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: settings.bg,
                color: settings.text,
              }}
            >
              {settings.showHero && (
                <div 
                  className="mb-6 p-8 rounded-lg text-center relative overflow-hidden"
                  style={{
                    backgroundColor: settings.primary,
                    color: '#FFFFFF',
                  }}
                >
                  {settings.heroImageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20"
                      style={{ backgroundImage: `url(${settings.heroImageUrl})` }}
                    />
                  )}
                  <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">{settings.heroTitle}</h1>
                    <p className="text-lg mb-4 opacity-90">{settings.heroSubtitle}</p>
                    <Button
                      style={{ backgroundColor: settings.accent }}
                      className="text-white hover:opacity-90"
                    >
                      {settings.heroCtaLabel}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: settings.card }}
                >
                  <h3 className="font-semibold mb-2">Sample Product Card</h3>
                  <p className="text-sm opacity-70">This shows how product cards will look</p>
                  <div className="mt-3">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: settings.primary }}
                    >
                      $99.99
                    </span>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: settings.card }}
                >
                  <h3 className="font-semibold mb-2">Sample Category</h3>
                  <p className="text-sm opacity-70">Category chips will use these colors</p>
                  <div className="mt-3">
                    <span 
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: settings.primary,
                        color: '#FFFFFF'
                      }}
                    >
                      Electronics
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Storefront Settings'}
        </Button>
      </div>
    </div>
  )
}
