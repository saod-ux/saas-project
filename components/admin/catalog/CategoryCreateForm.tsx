'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface CategoryForm {
  name: string
  nameAr: string
  slug: string
  isActive: boolean
  order: number
  imageUrl: string | null
}

interface CategoryCreateFormProps {
  onSubmit: (data: any) => void
  onError: (error: string) => void
  initialData?: Partial<CategoryForm>
  isEditing?: boolean
}

export function CategoryCreateForm({ onSubmit, onError, initialData, isEditing = false }: CategoryCreateFormProps) {
  const { language, isRTL } = useLanguage()
  
  const [form, setForm] = useState<CategoryForm>({
    name: initialData?.name || '',
    nameAr: initialData?.nameAr || '',
    slug: initialData?.slug || '',
    isActive: initialData?.isActive ?? true,
    order: initialData?.order || 0,
    imageUrl: initialData?.imageUrl || null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'category')

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setForm(prev => ({ ...prev, imageUrl: data.url }))
    } catch (error) {
      console.error('Upload error:', error)
      onError('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name || form.name.trim().length < 1) {
      newErrors.name = 'Category name is required'
    }

    if (!form.nameAr || form.nameAr.trim().length < 1) {
      newErrors.nameAr = 'Arabic category name is required'
    }

    if (!form.slug || form.slug.trim().length < 1) {
      newErrors.slug = 'Slug is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const payload = {
        name: form.name.trim(),
        nameAr: form.nameAr.trim(),
        slug: form.slug.trim(),
        isActive: form.isActive,
        order: form.order,
        imageUrl: form.imageUrl
      }

      onSubmit(payload)
    } catch (error) {
      console.error('Error creating category:', error)
      onError('Failed to create category')
    }
  }

  const isFormValid = form.name.trim().length > 0 && form.nameAr.trim().length > 0 && form.slug.trim().length > 0

  const getLocalizedText = (en: string, ar: string) => {
    return language === 'ar' ? ar : en;
  };

  return (
    <div className={`space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Form Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isEditing ? getLocalizedText('Edit Category', 'تعديل الفئة') : getLocalizedText('Create New Category', 'إنشاء فئة جديدة')}
        </h2>
        <p className="text-gray-600">
          {getLocalizedText('Fill in the details below to create a new category', 'املأ التفاصيل أدناه لإنشاء فئة جديدة')}
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {getLocalizedText('Basic Information', 'المعلومات الأساسية')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Name (English) */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
              {getLocalizedText('Category Name (English) *', 'اسم الفئة (الإنجليزية) *')}
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => {
                setForm(prev => ({ ...prev, name: e.target.value }));
                if (!isEditing) {
                  setForm(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                }
              }}
              placeholder={getLocalizedText('Enter category name', 'أدخل اسم الفئة')}
              className="h-11"
            />
            {errors.name && <p className="text-sm text-red-500 mt-2">{errors.name}</p>}
          </div>

          {/* Category Name (Arabic) */}
          <div>
            <Label htmlFor="nameAr" className="text-sm font-medium text-gray-700 mb-2 block">
              {getLocalizedText('Category Name (Arabic) *', 'اسم الفئة (العربية) *')}
            </Label>
            <Input
              id="nameAr"
              value={form.nameAr}
              onChange={(e) => setForm(prev => ({ ...prev, nameAr: e.target.value }))}
              placeholder={getLocalizedText('Enter Arabic category name', 'أدخل اسم الفئة بالعربية')}
              className="h-11"
              dir="rtl"
            />
            {errors.nameAr && <p className="text-sm text-red-500 mt-2">{errors.nameAr}</p>}
          </div>
        </div>

        {/* Slug */}
        <div className="mt-6">
          <Label htmlFor="slug" className="text-sm font-medium text-gray-700 mb-2 block">
            {getLocalizedText('Slug *', 'المعرف *')}
          </Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
            placeholder={getLocalizedText('category-slug', 'category-slug')}
            className="h-11"
          />
          <p className="text-xs text-gray-500 mt-2">
            {getLocalizedText('URL-friendly identifier', 'معرف مناسب للرابط')}
          </p>
          {errors.slug && <p className="text-sm text-red-500 mt-2">{errors.slug}</p>}
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {getLocalizedText('Category Image', 'صورة الفئة')}
        </h3>
        
        <div className="max-w-md">
          {form.imageUrl ? (
            <div className="relative group">
              <Image
                src={form.imageUrl}
                alt="Category preview"
                width={400}
                height={192}
                className="w-full h-48 object-cover rounded-lg border border-gray-200"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm(prev => ({ ...prev, imageUrl: null }))}
                className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-600 mb-1">
                  {isUploading 
                    ? getLocalizedText('Uploading...', 'جاري الرفع...')
                    : getLocalizedText('Click to upload image', 'انقر لرفع صورة')
                  }
                </span>
                <span className="text-xs text-gray-500">
                  {getLocalizedText('PNG, JPG up to 5MB', 'PNG، JPG حتى 5 ميجابايت')}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {getLocalizedText('Settings', 'الإعدادات')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order */}
          <div>
            <Label htmlFor="order" className="text-sm font-medium text-gray-700 mb-2 block">
              {getLocalizedText('Display Order', 'ترتيب العرض')}
            </Label>
            <Input
              id="order"
              type="number"
              value={form.order}
              onChange={(e) => setForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="h-11"
            />
            <p className="text-xs text-gray-500 mt-2">
              {getLocalizedText('Lower numbers appear first', 'الأرقام الأقل تظهر أولاً')}
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                {getLocalizedText('Active Status', 'الحالة')}
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                {getLocalizedText('Visible in storefront', 'مرئي في المتجر')}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getLocalizedText('Ready to save?', 'جاهز للحفظ؟')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {getLocalizedText('Review your changes and save the category', 'راجع التغييرات واحفظ الفئة')}
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isUploading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md"
          >
            {isUploading 
              ? getLocalizedText('Uploading...', 'جاري الرفع...')
              : isEditing 
                ? getLocalizedText('Update Category', 'تحديث الفئة')
                : getLocalizedText('Create Category', 'إنشاء فئة')
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
