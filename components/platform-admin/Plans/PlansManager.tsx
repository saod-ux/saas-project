"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Users, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: string
  features: {
    maxProducts: number
    maxCategories: number
    maxDomains: number
    maxStorage: number
    customDomain: boolean
    analytics: boolean
    prioritySupport: boolean
    apiAccess: boolean
    whiteLabel: boolean
  }
  isActive: boolean
  createdAt: string
  _count: {
    subscriptions: number
  }
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'KWD',
    interval: 'month',
    features: {
      maxProducts: 0,
      maxCategories: 0,
      maxDomains: 0,
      maxStorage: 0,
      customDomain: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabel: false
    },
    isActive: true
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/platform/plans')
      const data = await response.json()
      if (data.ok) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingPlan ? `/api/platform/plans/${editingPlan.id}` : '/api/platform/plans'
      const method = editingPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.ok) {
        toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully')
        setIsDialogOpen(false)
        setEditingPlan(null)
        resetForm()
        fetchPlans()
      } else {
        toast.error(data.error || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      isActive: plan.isActive
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'KWD',
      interval: 'month',
      features: {
        maxProducts: 0,
        maxCategories: 0,
        maxDomains: 0,
        maxStorage: 0,
        customDomain: false,
        analytics: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false
      },
      isActive: true
    })
  }

  const handleNewPlan = () => {
    setEditingPlan(null)
    resetForm()
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plans Management</CardTitle>
          <CardDescription>Manage subscription plans and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading plans...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plans Management</h2>
          <p className="text-gray-600">Manage subscription plans and feature limits</p>
        </div>
        <Button onClick={handleNewPlan}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isActive ? '' : 'opacity-60'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {plan.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  {plan.price} {plan.currency}/{plan.interval}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Products</span>
                    <span className="font-medium">{plan.features.maxProducts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Categories</span>
                    <span className="font-medium">{plan.features.maxCategories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Domains</span>
                    <span className="font-medium">{plan.features.maxDomains}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage</span>
                    <span className="font-medium">{plan.features.maxStorage}MB</span>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  {plan.features.customDomain && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Custom Domain</span>
                    </div>
                  )}
                  {plan.features.analytics && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Analytics</span>
                    </div>
                  )}
                  {plan.features.prioritySupport && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Priority Support</span>
                    </div>
                  )}
                  {plan.features.apiAccess && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>API Access</span>
                    </div>
                  )}
                  {plan.features.whiteLabel && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>White Label</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{plan._count.subscriptions} subscribers</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update plan details and features' : 'Set up a new subscription plan'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({...formData, currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KWD">KWD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval">Interval</Label>
                <Select
                  value={formData.interval}
                  onValueChange={(value) => setFormData({...formData, interval: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Feature Limits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxProducts">Max Products</Label>
                  <Input
                    id="maxProducts"
                    type="number"
                    value={formData.features.maxProducts}
                    onChange={(e) => setFormData({
                      ...formData, 
                      features: {...formData.features, maxProducts: parseInt(e.target.value)}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxCategories">Max Categories</Label>
                  <Input
                    id="maxCategories"
                    type="number"
                    value={formData.features.maxCategories}
                    onChange={(e) => setFormData({
                      ...formData, 
                      features: {...formData.features, maxCategories: parseInt(e.target.value)}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxDomains">Max Domains</Label>
                  <Input
                    id="maxDomains"
                    type="number"
                    value={formData.features.maxDomains}
                    onChange={(e) => setFormData({
                      ...formData, 
                      features: {...formData.features, maxDomains: parseInt(e.target.value)}
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxStorage">Max Storage (MB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={formData.features.maxStorage}
                    onChange={(e) => setFormData({
                      ...formData, 
                      features: {...formData.features, maxStorage: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <div className="space-y-2">
                  {[
                    { key: 'customDomain', label: 'Custom Domain' },
                    { key: 'analytics', label: 'Analytics' },
                    { key: 'prioritySupport', label: 'Priority Support' },
                    { key: 'apiAccess', label: 'API Access' },
                    { key: 'whiteLabel', label: 'White Label' }
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Switch
                        id={feature.key}
                        checked={formData.features[feature.key as keyof typeof formData.features] as boolean}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          features: {
                            ...formData.features,
                            [feature.key]: checked
                          }
                        })}
                      />
                      <Label htmlFor={feature.key}>{feature.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


