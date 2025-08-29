'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProductOption {
  id: string
  name: string
  required: boolean
  order: number
  values: ProductOptionValue[]
}

interface ProductOptionValue {
  id: string
  value: string
  order: number
}

interface ProductVariant {
  id: string
  sku: string | null
  price: number
  stock: number
  weight: number | null
  options: { optionName: string; optionValue: string }[]
  images: { id: string; key: string; alt: string | null; order: number }[]
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

export default function ProductOptionsPage({ params }: { params: { id: string } }) {
  const { isSignedIn, isLoaded } = useAuth()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [options, setOptions] = useState<ProductOption[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingOption, setCreatingOption] = useState(false)
  const [creatingVariant, setCreatingVariant] = useState(false)

  // New option form
  const [newOption, setNewOption] = useState({
    name: '',
    required: true,
    values: [{ value: '', order: 0 }]
  })

  // New variant form
  const [newVariant, setNewVariant] = useState({
    sku: '',
    price: 0,
    stock: 0,
    weight: 0,
    optionValues: [] as string[]
  })

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

  async function loadOptions() {
    if (!isSignedIn || !tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/products/${params.id}/options`, {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load options')
      }
      setOptions(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadVariants() {
    if (!isSignedIn || !tenantSlug) return
    
    try {
      const res = await fetch(`/api/v1/products/${params.id}/variants`, {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load variants')
      }
      setVariants(json.data)
    } catch (e: any) {
      console.error('Failed to load variants:', e.message)
    }
  }

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      loadOptions()
      loadVariants()
    }
  }, [isSignedIn, tenantSlug])

  async function createOption() {
    if (!isSignedIn || !tenantSlug) return
    
    setCreatingOption(true)
    try {
      const res = await fetch(`/api/v1/products/${params.id}/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(newOption)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to create option')
      }
      
      await loadOptions()
      await loadVariants()
      
      // Reset form
      setNewOption({
        name: '',
        required: true,
        values: [{ value: '', order: 0 }]
      })
      
      alert('Option created successfully!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreatingOption(false)
    }
  }

  async function createVariant() {
    if (!isSignedIn || !tenantSlug) return
    
    setCreatingVariant(true)
    try {
      const res = await fetch(`/api/v1/products/${params.id}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(newVariant)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to create variant')
      }
      
      await loadVariants()
      
      // Reset form
      setNewVariant({
        sku: '',
        price: 0,
        stock: 0,
        weight: 0,
        optionValues: []
      })
      
      alert('Variant created successfully!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreatingVariant(false)
    }
  }

  function addOptionValue() {
    setNewOption(prev => ({
      ...prev,
      values: [...prev.values, { value: '', order: prev.values.length }]
    }))
  }

  function updateOptionValue(index: number, value: string) {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.map((v, i) => 
        i === index ? { ...v, value } : v
      )
    }))
  }

  function removeOptionValue(index: number) {
    setNewOption(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }))
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Product Options & Variants</h1>
          <Button onClick={() => window.location.href = '/admin/products'}>
            Back to Products
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Options */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Product Options</h2>
              
              {/* Create New Option */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Add New Option</h3>
                
                <div>
                  <Label htmlFor="optionName">Option Name</Label>
                  <Input
                    id="optionName"
                    value={newOption.name}
                    onChange={(e) => setNewOption(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Size, Color, Material"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newOption.required}
                    onChange={(e) => setNewOption(prev => ({ ...prev, required: e.target.checked }))}
                  />
                  <Label htmlFor="required">Required</Label>
                </div>

                <div>
                  <Label>Option Values</Label>
                  <div className="space-y-2">
                    {newOption.values.map((value, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={value.value}
                          onChange={(e) => updateOptionValue(index, e.target.value)}
                          placeholder={`Value ${index + 1}`}
                        />
                        {newOption.values.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeOptionValue(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addOptionValue}>
                      Add Value
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={createOption}
                  disabled={creatingOption || !newOption.name || newOption.values.some(v => !v.value)}
                  className="w-full"
                >
                  {creatingOption ? 'Creating...' : 'Create Option'}
                </Button>
              </div>

              {/* Existing Options */}
              <div className="space-y-4">
                {options.map((option) => (
                  <div key={option.id} className="border rounded-lg p-4">
                    <h4 className="font-medium">{option.name}</h4>
                    <p className="text-sm text-gray-600">
                      {option.required ? 'Required' : 'Optional'}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Values:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {option.values.map((value) => (
                          <span
                            key={value.id}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                          >
                            {value.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Variants */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Product Variants</h2>
              
              {/* Create New Variant */}
              {options.length > 0 && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium">Add New Variant</h3>
                  
                  <div>
                    <Label htmlFor="sku">SKU (optional)</Label>
                    <Input
                      id="sku"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="e.g., TSHIRT-RED-M"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight">Weight (grams, optional)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={newVariant.weight}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label>Select Option Values</Label>
                    <div className="space-y-2">
                      {options.map((option) => (
                        <div key={option.id}>
                          <p className="text-sm font-medium">{option.name}:</p>
                          <select
                            className="w-full p-2 border rounded"
                            onChange={(e) => {
                              const optionValueId = e.target.value
                              setNewVariant(prev => ({
                                ...prev,
                                optionValues: prev.optionValues.includes(optionValueId)
                                  ? prev.optionValues
                                  : [...prev.optionValues, optionValueId]
                              }))
                            }}
                          >
                            <option value="">Select {option.name}</option>
                            {option.values.map((value) => (
                              <option key={value.id} value={value.id}>
                                {value.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={createVariant}
                    disabled={creatingVariant || newVariant.price <= 0 || newVariant.optionValues.length === 0}
                    className="w-full"
                  >
                    {creatingVariant ? 'Creating...' : 'Create Variant'}
                  </Button>
                </div>
              )}

              {/* Existing Variants */}
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {variant.sku || `Variant ${variant.id.slice(-6)}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          ${variant.price} | Stock: {variant.stock}
                        </p>
                        {variant.weight && (
                          <p className="text-sm text-gray-600">
                            Weight: {variant.weight}g
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium">Options:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variant.options.map((option, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {option.optionName}: {option.optionValue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
