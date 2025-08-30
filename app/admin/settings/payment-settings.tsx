'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, CreditCard, Shield } from 'lucide-react'

interface PaymentSettings {
  myfatoorahApiKey: string
  myfatoorahSecretKey: string
  myfatoorahIsTest: boolean
  knetMerchantId: string
  knetApiKey: string
  knetIsTest: boolean
  stripePublishableKey: string
  stripeSecretKey: string
  stripeIsTest: boolean
}

interface TenantSettings {
  id: string
  name: string
  slug: string
  myfatoorahApiKey: string | null
  myfatoorahSecretKey: string | null
  myfatoorahIsTest: boolean
  knetMerchantId: string | null
  knetApiKey: string | null
  knetIsTest: boolean
  stripePublishableKey: string | null
  stripeSecretKey: string | null
  stripeIsTest: boolean
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    myfatoorahApiKey: '',
    myfatoorahSecretKey: '',
    myfatoorahIsTest: true,
    knetMerchantId: '',
    knetApiKey: '',
    knetIsTest: true,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeIsTest: true,
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Extract tenant slug from hostname
  const getTenantSlug = () => {
    if (typeof window === 'undefined') return null
    const hostname = window.location.hostname.toLowerCase()
    const parts = hostname.split('.')
    const isLocalhost = parts.includes('localhost')
    if (isLocalhost && parts.length >= 2) {
      return parts[0] || null
    }
    return null
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const tenantSlug = getTenantSlug()
    if (!tenantSlug) return

    setLoading(true)
    try {
      const response = await fetch('/api/v1/settings', {
        headers: { 'x-tenant-slug': tenantSlug }
      })
      
      if (response.ok) {
        const data = await response.json()
        const tenant = data.data
        
        setSettings({
          myfatoorahApiKey: tenant.myfatoorahApiKey || '',
          myfatoorahSecretKey: tenant.myfatoorahSecretKey || '',
          myfatoorahIsTest: tenant.myfatoorahIsTest ?? true,
          knetMerchantId: tenant.knetMerchantId || '',
          knetApiKey: tenant.knetApiKey || '',
          knetIsTest: tenant.knetIsTest ?? true,
          stripePublishableKey: tenant.stripePublishableKey || '',
          stripeSecretKey: tenant.stripeSecretKey || '',
          stripeIsTest: tenant.stripeIsTest ?? true,
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setMessage({ type: 'error', text: 'Failed to load payment settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const tenantSlug = getTenantSlug()
    if (!tenantSlug) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          myfatoorahApiKey: settings.myfatoorahApiKey,
          myfatoorahSecretKey: settings.myfatoorahSecretKey,
          myfatoorahIsTest: settings.myfatoorahIsTest,
          knetMerchantId: settings.knetMerchantId,
          knetApiKey: settings.knetApiKey,
          knetIsTest: settings.knetIsTest,
          stripePublishableKey: settings.stripePublishableKey,
          stripeSecretKey: settings.stripeSecretKey,
          stripeIsTest: settings.stripeIsTest,
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment settings saved successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save payment settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof PaymentSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const testConnection = async (gateway: 'myfatoorah' | 'knet' | 'stripe') => {
    const tenantSlug = getTenantSlug()
    if (!tenantSlug) return

    try {
      const response = await fetch('/api/v1/settings/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ gateway })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `${gateway.toUpperCase()} connection test successful!` })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: `${gateway.toUpperCase()} connection failed: ${error.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `${gateway.toUpperCase()} connection test failed` })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payment settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Gateway Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure your payment gateways to receive payments directly to your accounts
          </p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="myfatoorah" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="myfatoorah" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            MyFatoorah
          </TabsTrigger>
          <TabsTrigger value="knet" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            KNET
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
        </TabsList>

        {/* MyFatoorah Settings */}
        <TabsContent value="myfatoorah" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                MyFatoorah Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="myfatoorahApiKey">API Key</Label>
                  <Input
                    id="myfatoorahApiKey"
                    type="password"
                    value={settings.myfatoorahApiKey}
                    onChange={(e) => handleInputChange('myfatoorahApiKey', e.target.value)}
                    placeholder="Enter your MyFatoorah API key"
                  />
                </div>
                <div>
                  <Label htmlFor="myfatoorahSecretKey">Secret Key</Label>
                  <Input
                    id="myfatoorahSecretKey"
                    type="password"
                    value={settings.myfatoorahSecretKey}
                    onChange={(e) => handleInputChange('myfatoorahSecretKey', e.target.value)}
                    placeholder="Enter your MyFatoorah secret key"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="myfatoorahIsTest"
                  checked={settings.myfatoorahIsTest}
                  onCheckedChange={(checked) => handleInputChange('myfatoorahIsTest', checked)}
                />
                <Label htmlFor="myfatoorahIsTest">Test Mode (Sandbox)</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testConnection('myfatoorah')}
                  variant="outline"
                  disabled={!settings.myfatoorahApiKey || !settings.myfatoorahSecretKey}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KNET Settings */}
        <TabsContent value="knet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                KNET Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="knetMerchantId">Merchant ID</Label>
                  <Input
                    id="knetMerchantId"
                    value={settings.knetMerchantId}
                    onChange={(e) => handleInputChange('knetMerchantId', e.target.value)}
                    placeholder="Enter your KNET merchant ID"
                  />
                </div>
                <div>
                  <Label htmlFor="knetApiKey">API Key</Label>
                  <Input
                    id="knetApiKey"
                    type="password"
                    value={settings.knetApiKey}
                    onChange={(e) => handleInputChange('knetApiKey', e.target.value)}
                    placeholder="Enter your KNET API key"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="knetIsTest"
                  checked={settings.knetIsTest}
                  onCheckedChange={(checked) => handleInputChange('knetIsTest', checked)}
                />
                <Label htmlFor="knetIsTest">Test Mode (Sandbox)</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testConnection('knet')}
                  variant="outline"
                  disabled={!settings.knetMerchantId || !settings.knetApiKey}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Settings */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                  <Input
                    id="stripePublishableKey"
                    value={settings.stripePublishableKey}
                    onChange={(e) => handleInputChange('stripePublishableKey', e.target.value)}
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor="stripeSecretKey">Secret Key</Label>
                  <Input
                    id="stripeSecretKey"
                    type="password"
                    value={settings.stripeSecretKey}
                    onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="stripeIsTest"
                  checked={settings.stripeIsTest}
                  onCheckedChange={(checked) => handleInputChange('stripeIsTest', checked)}
                />
                <Label htmlFor="stripeIsTest">Test Mode (Sandbox)</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testConnection('stripe')}
                  variant="outline"
                  disabled={!settings.stripePublishableKey || !settings.stripeSecretKey}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each merchant configures their own payment gateway accounts</li>
          <li>• Payments go directly to your merchant accounts, not through our platform</li>
          <li>• We only process the payment flow, not the actual money</li>
          <li>• Test mode allows you to test payments without real charges</li>
        </ul>
      </div>
    </div>
  )
}
