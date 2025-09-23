'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Store, Utensils, ArrowRight, ArrowLeft, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Step = 'store-info' | 'template' | 'creating'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('store-info')
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [template, setTemplate] = useState<'RESTAURANT' | 'RETAIL'>('RETAIL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSlugChange = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setStoreSlug(normalized)
  }

  const handleNext = () => {
    if (step === 'store-info') {
      if (!storeName.trim() || !storeSlug.trim()) {
        setError('Please fill in all fields')
        return
      }
      setError(null)
      setStep('template')
    }
  }

  const handleBack = () => {
    if (step === 'template') {
      setStep('store-info')
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    setStep('creating')

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: storeName.trim(),
          slug: storeSlug,
          template
        })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create store')
      }

      // Redirect to admin settings
      router.push(`/${storeSlug}/admin/settings/storefront`)

    } catch (err: any) {
      setError(err.message)
      setStep('template')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'store-info':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Let's start by setting up your store details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., My Amazing Store"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="storeSlug">Store URL</Label>
                <div className="mt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">yourstore.com/</span>
                    <Input
                      id="storeSlug"
                      value={storeSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="my-amazing-store"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This will be your store's unique URL. Only letters, numbers, and hyphens allowed.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!storeName.trim() || !storeSlug.trim()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'template':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Template</CardTitle>
              <CardDescription>
                Select the template that best fits your business type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={template}
                onValueChange={(value) => setTemplate(value as 'RESTAURANT' | 'RETAIL')}
                className="space-y-4"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="RESTAURANT" id="restaurant" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="restaurant" className="flex items-center space-x-2 cursor-pointer">
                      <Utensils className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Restaurant</span>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Perfect for food delivery, takeout, and restaurant businesses
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="RETAIL" id="retail" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="retail" className="flex items-center space-x-2 cursor-pointer">
                      <Store className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Retail</span>
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Ideal for e-commerce, product sales, and retail businesses
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Store'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'creating':
        return (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Creating Your Store</h3>
              <p className="text-gray-600">Setting up your storefront...</p>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600">Let's set up your store in just a few steps</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'store-info' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'store-info' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {step === 'store-info' ? '1' : <Check className="h-4 w-4" />}
              </div>
              <span className="text-sm font-medium">Store Info</span>
            </div>
            
            <div className={`w-8 h-0.5 ${step === 'template' || step === 'creating' ? 'bg-green-200' : 'bg-gray-200'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'template' ? 'text-blue-600' : step === 'creating' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'template' ? 'bg-blue-100' : step === 'creating' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {step === 'creating' ? <Check className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-medium">Template</span>
            </div>
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  )
}











