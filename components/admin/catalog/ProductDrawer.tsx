'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { EditDrawer } from '@/components/admin/EditDrawer'
// Using Firebase Storage upload via API
import { Loader2, Upload, X } from 'lucide-react'

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
}

interface ProductDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
  tenantSlug: string
}

export function ProductDrawer({ isOpen, onClose, onSuccess, categories, tenantSlug }: ProductDrawerProps) {
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
    gallery: []
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => {
    setForm({
      title: '',
      sku: '',
      categoryId: '',
      price: 0,
      compareAtPrice: undefined,
      stock: 0,
      status: 'active',
      description: '',
      imageUrl: '',
      gallery: []
    })
    setImageFile(null)
    setGalleryFiles([])
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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
      setSubmitting(true)

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

      const response = await fetch(`/api/admin/catalog/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.ok) {
        handleClose()
        onSuccess()
      } else {
        setErrors({ submit: data.error || 'Failed to create product' })
      }
    } catch (error) {
      console.error('Error creating product:', error)
      setErrors({ submit: 'Failed to create product' })
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = form.title && form.categoryId && form.imageUrl && !submitting && !uploading

  return (
    <EditDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Product"
    >
      <div className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter product title"
            maxLength={120}
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
              onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
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
            onChange={(e) => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
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
                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
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
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
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

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </div>
    </EditDrawer>
  )
}




