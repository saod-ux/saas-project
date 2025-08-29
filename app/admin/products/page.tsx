"use client"

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Product {
  id: string
  title: string
  price: number
  stock: number
  status: string
  productImages: Array<{
    id: string
    file: {
      key: string
      filename: string
      mimeType: string
    }
  }>
}

// Extract tenant slug from hostname
function extractTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname.toLowerCase()
  const parts = hostname.split('.')
  
  // Handle dev subdomains like acme.localhost or moka.localhost
  const isLocalhost = parts.includes('localhost')
  if (isLocalhost && parts.length >= 2) {
    return parts[0] || null
  }
  
  return null
}

export default function AdminProductsPage() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const { user } = useUser()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [registering, setRegistering] = useState(false)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')


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

  async function registerUser() {
    if (!isSignedIn || !tenantSlug || !user) return
    
    setRegistering(true)
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress || 'user@example.com',
          name: user.fullName || 'User'
        })
      })
      
      if (res.ok) {
        setShowRegistration(false)
        await load() // Reload products after registration
      } else {
        const error = await res.json()
        if (error.error?.includes('already has membership')) {
          setShowRegistration(false)
          await load() // User already registered, just load products
        } else {
          throw new Error(error.error || 'Registration failed')
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRegistering(false)
    }
  }

  async function load() {
    if (!isSignedIn || !tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/products', { 
        cache: 'no-store',
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          setShowRegistration(true)
          return
        }
        throw new Error(json?.error || 'Failed to load')
      }
      setProducts(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      load()
    }
  }, [isSignedIn, tenantSlug])

  async function uploadImage(file: File): Promise<string | null> {
    try {
      setUploadProgress('Getting upload URL...')
      
      // Step 1: Get presigned URL
      const presignRes = await fetch('/api/v1/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug!
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      })
      
      if (!presignRes.ok) {
        throw new Error('Failed to get upload URL')
      }
      
      const presignData = await presignRes.json()
      setUploadProgress('Uploading to storage...')
      
      // Step 2: Upload to R2 (simulated for now)
      // In production, this would be a real upload to R2
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUploadProgress('Recording file...')
      
      // Step 3: Record file in database
      const attachRes = await fetch('/api/v1/uploads/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug!
        },
        body: JSON.stringify({
          key: presignData.data.key,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      })
      
      if (!attachRes.ok) {
        throw new Error('Failed to record file')
      }
      
      const attachData = await attachRes.json()
      setUploadProgress('Upload complete!')
      
      return attachData.data.file.id
    } catch (error: any) {
      setUploadProgress(`Upload failed: ${error.message}`)
      return null
    }
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!isSignedIn || !tenantSlug) return
    
    setUploading(true)
    setUploadProgress('Creating product...')
    
    try {
      const body = {
        title,
        price: Number(price),
        stock: Number(stock || 0),
      }
      
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(body),
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to create')
      
      const productId = json.data.id
      
      // If there are selected files, upload and attach them
      if (selectedFiles.length > 0) {
        setUploadProgress('Uploading images...')
        
        for (const file of selectedFiles) {
          const fileId = await uploadImage(file)
          
          if (fileId) {
            // Attach file to product using the file ID
            const attachRes = await fetch('/api/v1/uploads/attach', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-tenant-slug': tenantSlug
              },
              body: JSON.stringify({
                fileId: fileId,
                productId: productId
              })
            })
            
            if (!attachRes.ok) {
              console.warn('Failed to attach image to product')
            }
          }
        }
      }
      
      setOpen(false)
      setTitle('')
      setPrice('')
      setStock('')
      setSelectedFiles([])
      setUploadProgress('')
      await load()
    } catch (e: any) {
      setUploadProgress(`Error: ${e.message}`)
      alert(e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }



  if (!isLoaded) {
    return <div className="p-6">Loading...</div>
  }

  if (!isSignedIn) {
    return <div className="p-6">Redirecting to sign in...</div>
  }

  if (!tenantSlug) {
    return <div className="p-6">No tenant found. Please access via subdomain like acme.localhost:3001</div>
  }

  if (showRegistration) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold mb-4">Welcome to {tenantSlug}!</h1>
          <p className="text-gray-600 mb-4">
            You need to register to access this tenant. This will create your account and give you OWNER access.
          </p>
          <Button 
            onClick={registerUser} 
            disabled={registering}
            className="w-full"
          >
            {registering ? 'Registering...' : 'Register & Continue'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Products - {tenantSlug}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/settings'}>
            Settings
          </Button>
          <Button onClick={() => setOpen(true)}>New Product</Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Image</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Stock</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {p.productImages && p.productImages.length > 0 ? (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                            📷
                          </div>
                          {p.productImages.length > 1 && (
                            <span className="text-xs text-gray-500">+{p.productImages.length - 1}</span>
                          )}
                        </>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs">
                          No img
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{p.title}</td>
                  <td className="px-3 py-2">${p.price}</td>
                  <td className="px-3 py-2">{p.stock}</td>
                  <td className="px-3 py-2">{p.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/admin/products/${p.id}/options`}
                      >
                        Options
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/product/${p.id}`}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">New Product</h2>
              <button onClick={() => setOpen(false)} className="text-sm">✕</button>
            </div>
            <form onSubmit={createProduct} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="image">Product Images (Optional)</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {selectedFiles.length > 0 && (
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    ))}
                  </div>
                )}
              </div>
              {uploadProgress && (
                <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                  {uploadProgress}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
