'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
// Using Firebase Storage upload via API
import { Loader2, X } from 'lucide-react'
import { normalizeNumericInput, parseNumericInput } from '@/lib/utils/normalize-digits'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductForm {
  title: string
  sku: string
  categoryId: string
  price: number
  compareAtPrice?: number
  stock: number
  status: 'active' | 'draft'
  description: string
  imageUrl: string
  gallery: string[]
  isBestSeller: boolean
  isNewArrival: boolean
  isOnOffer: boolean
}

interface ProductCreateFormProps {
  categories: Category[]
  tenantSlug: string
  onSubmit: (data: any) => void
  onError: (error: string) => void
}

export function ProductCreateForm({ categories, tenantSlug, onSubmit, onError }: ProductCreateFormProps) {
  const [form, setForm] = useState<ProductForm>({
    title: '',
    sku: '',
    categoryId: '',
    price: 0,
    compareAtPrice: undefined,
    stock: 0,
    status: 'active',
    description: '',
    imageUrl: '',
    gallery: [],
    isBestSeller: false,
    isNewArrival: false,
    isOnOffer: false
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.title || form.title.length < 2 || form.title.length > 120) {
      newErrors.title = 'Title must be 2-120 characters'
    }
    if (form.sku && form.sku.length > 80) {
      newErrors.sku = 'SKU must be 80 characters or less'
    }
    if (!form.categoryId) {
      newErrors.categoryId = 'Category is required'
    }
    if (form.price < 0) {
      newErrors.price = 'Price must be 0 or greater'
    }
    if (form.compareAtPrice !== undefined && form.compareAtPrice < form.price) {
      newErrors.compareAtPrice = 'Compare-at price must be greater than or equal to price'
    }
    if (form.stock < 0) {
      newErrors.stock = 'Stock must be 0 or greater'
    }
    if (form.description && form.description.length > 4000) {
      newErrors.description = 'Description must be 4000 characters or less'
    }
    if (!form.imageUrl) {
      newErrors.imageUrl = 'Primary image is required'
    }
    if (form.gallery.length > 6) {
      newErrors.gallery = 'Maximum 6 gallery images allowed'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tenantSlug', tenantSlug)
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      if (result.ok) {
        setForm(prev => ({ ...prev, imageUrl: result.data.url }))
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      setErrors(prev => ({ ...prev, imageUrl: 'Upload failed. Please try again.' }))
    } finally {
      setUploading(false)
    }
  }

  const handleGalleryUpload = async (files: File[]) => {
    try {
      setUploading(true)
      const urls: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('tenantSlug', tenantSlug)
        
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        })
        
        const result = await response.json()
        if (result.ok) {
          urls.push(result.data.url)
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      }
      setForm(prev => ({ ...prev, gallery: [...prev.gallery, ...urls] }))
    } catch (error) {
      console.error('Gallery upload failed:', error)
      setErrors(prev => ({ ...prev, gallery: 'Upload failed. Please try again.' }))
    } finally {
      setUploading(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Upload primary image if file is selected
      if (imageFile) {
        await handleImageUpload(imageFile)
      }

      // Upload gallery images if files are selected
      if (galleryFiles.length > 0) {
        await handleGalleryUpload(galleryFiles)
      }

      const payload = {
        title: form.title,
        sku: form.sku || undefined,
        categoryId: form.categoryId,
        price: form.price,
        compareAtPrice: form.compareAtPrice,
        stock: form.stock,
        status: form.status,
        description: form.description || undefined,
        imageUrl: form.imageUrl,
        gallery: form.gallery.length > 0 ? form.gallery : undefined
      }

      onSubmit(payload)
    } catch (error) {
      console.error('Error creating product:', error)
      onError('Failed to create product')
    }
  }

  const isFormValid = form.title && form.categoryId && form.imageUrl && !uploading

  return (
    <>
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter product title"
          maxLength={120}
          className="text-gray-900 placeholder:text-gray-500"
        />
        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
      </div>

      {/* SKU */}
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          value={form.sku}
          onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
          placeholder="Enter SKU (optional)"
          maxLength={80}
          className="text-gray-900 placeholder:text-gray-500"
        />
        {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={form.categoryId} onValueChange={(value) => setForm(prev => ({ ...prev, categoryId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
      </div>

      {/* Price and Compare-at Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => {
              const normalized = normalizeNumericInput(e.target.value);
              setForm(prev => ({ ...prev, price: parseNumericInput(normalized) }));
            }}
            placeholder="0.00"
          />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>
        <div>
          <Label htmlFor="compareAtPrice">Compare-at Price</Label>
          <Input
            id="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            value={form.compareAtPrice || ''}
            onChange={(e) => setForm(prev => ({ ...prev, compareAtPrice: parseFloat(e.target.value) || undefined }))}
            placeholder="0.00"
          />
          {errors.compareAtPrice && <p className="text-sm text-red-500 mt-1">{errors.compareAtPrice}</p>}
        </div>
      </div>

      {/* Stock */}
      <div>
        <Label htmlFor="stock">Stock Quantity *</Label>
        <Input
          id="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => {
            const normalized = normalizeNumericInput(e.target.value);
            setForm(prev => ({ ...prev, stock: parseInt(normalized) || 0 }));
          }}
          placeholder="0"
        />
        {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock}</p>}
      </div>

      {/* Status */}
      <div>
        <Label>Status *</Label>
        <RadioGroup value={form.status} onValueChange={(value: 'active' | 'draft') => setForm(prev => ({ ...prev, status: value }))}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="active" id="active" />
            <Label htmlFor="active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="draft" id="draft" />
            <Label htmlFor="draft">Draft</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Product Flags */}
      <div className="space-y-4">
        <Label>Product Flags</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="isBestSeller"
              checked={form.isBestSeller}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, isBestSeller: checked }))}
            />
            <Label htmlFor="isBestSeller">Best Seller</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isNewArrival"
              checked={form.isNewArrival}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, isNewArrival: checked }))}
            />
            <Label htmlFor="isNewArrival">New Arrival</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isOnOffer"
              checked={form.isOnOffer}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, isOnOffer: checked }))}
            />
            <Label htmlFor="isOnOffer">Special Offer</Label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter product description"
          maxLength={4000}
          rows={4}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      {/* Primary Image */}
      <div>
        <Label htmlFor="image">Primary Image *</Label>
        <div className="space-y-2">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setImageFile(file)
                handleImageUpload(file)
              }
            }}
            disabled={uploading}
          />
          {form.imageUrl && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <Image src={form.imageUrl} alt="Preview" width={128} height={128} className="w-full h-full object-cover" />
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
        {errors.imageUrl && <p className="text-sm text-red-500 mt-1">{errors.imageUrl}</p>}
      </div>

      {/* Gallery Images */}
      <div>
        <Label htmlFor="gallery">Gallery Images (up to 6)</Label>
        <div className="space-y-2">
          <Input
            id="gallery"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) {
                setGalleryFiles(files)
                handleGalleryUpload(files)
              }
            }}
            disabled={uploading || form.gallery.length >= 6}
          />
          {form.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.gallery.map((url, index) => (
                <div key={index} className="relative w-20 h-20 border rounded-lg overflow-hidden">
                  <Image src={url} alt={`Gallery ${index + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.gallery.length >= 6 && (
            <p className="text-sm text-muted">Maximum 6 gallery images reached</p>
          )}
        </div>
        {errors.gallery && <p className="text-sm text-red-500 mt-1">{errors.gallery}</p>}
      </div>
    </>
  )
}
