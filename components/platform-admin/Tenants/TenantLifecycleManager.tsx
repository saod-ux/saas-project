"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MoreHorizontal, Play, Pause, Archive, AlertTriangle, CheckCircle, XCircle, ExternalLink, Settings, FileText } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Tenant {
  id: string
  slug: string
  name: string
  domain?: string
  template: string
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  _count: {
    products: number
    orders: number
    memberships: number
  }
}

interface TenantLifecycleManagerProps {
  tenants: Tenant[]
  onRefresh: () => void
  onMerchantCreated?: (data: any) => void
}

const statusConfig = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Tenant is fully operational'
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Pause,
    description: 'Tenant is temporarily disabled'
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Archive,
    description: 'Tenant is permanently archived'
  }
}

export default function TenantLifecycleManager({ tenants, onRefresh, onMerchantCreated }: TenantLifecycleManagerProps) {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'>('ACTIVE')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleStatusChange = async (tenant: Tenant, status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED', reason?: string, notes?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/platform/tenants/${tenant.slug}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason, notes })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tenant status')
      }

      toast.success(`Tenant ${status.toLowerCase()} successfully`)
      onRefresh()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error updating tenant status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update tenant status')
    } finally {
      setLoading(false)
    }
  }

  const openStatusDialog = (tenant: Tenant, status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    setSelectedTenant(tenant)
    setNewStatus(status)
    setReason('')
    setNotes('')
    setIsDialogOpen(true)
  }

  const getStatusIcon = (status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    const config = statusConfig[status]
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getStatusBadge = (status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    const config = statusConfig[status]
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    )
  }

  const canChangeStatus = (currentStatus: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED', newStatus: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED') => {
    // Can't change from ARCHIVED to anything else
    if (currentStatus === 'ARCHIVED' && newStatus !== 'ARCHIVED') {
      return false
    }
    // Can't change to the same status
    if (currentStatus === newStatus) {
      return false
    }
    return true
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {tenants.map((tenant) => {
          const config = statusConfig[tenant.status]
          const Icon = config.icon

          return (
            <Card key={tenant.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <CardDescription>
                      {tenant.slug} • {tenant.template} • {tenant._count.products} products • {tenant._count.orders} orders
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tenant.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canChangeStatus(tenant.status, 'ACTIVE') && (
                          <DropdownMenuItem onClick={() => openStatusDialog(tenant, 'ACTIVE')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {canChangeStatus(tenant.status, 'SUSPENDED') && (
                          <DropdownMenuItem onClick={() => openStatusDialog(tenant, 'SUSPENDED')}>
                            <Pause className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {canChangeStatus(tenant.status, 'ARCHIVED') && (
                          <DropdownMenuItem onClick={() => openStatusDialog(tenant, 'ARCHIVED')}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/platform/merchants/${tenant.slug}`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Content Management
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon className="h-4 w-4" />
                      {config.description}
                    </div>
                    {tenant.domain && (
                      <div>Domain: {tenant.domain}</div>
                    )}
                    <div>Created: {new Date(tenant.createdAt).toLocaleDateString()}</div>
                  </div>
                  
                  {/* Quick Action Links */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/admin/${tenant.slug}`}>
                      <Button variant="outline" size="sm" className="h-8">
                        <Settings className="h-4 w-4 mr-1" />
                        Admin
                      </Button>
                    </Link>
                    <Link href={`/${tenant.slug}/retail`} target="_blank">
                      <Button variant="outline" size="sm" className="h-8">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Storefront
                      </Button>
                    </Link>
                    <Link href={`/admin/platform/merchants/${tenant.slug}/content`}>
                      <Button variant="outline" size="sm" className="h-8">
                        <FileText className="h-4 w-4 mr-1" />
                        Content
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Tenant Status</DialogTitle>
            <DialogDescription>
              {selectedTenant && (
                <>Change status for <strong>{selectedTenant.name}</strong> to <strong>{newStatus.toLowerCase()}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this status being changed?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this change..."
                rows={3}
              />
            </div>

            {newStatus === 'SUSPENDED' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Suspending a tenant will disable their storefront and admin access. 
                  They will be notified of the suspension.
                </AlertDescription>
              </Alert>
            )}

            {newStatus === 'ARCHIVED' && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Archiving a tenant is permanent and cannot be undone. 
                  All data will be preserved but the tenant will be completely disabled.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTenant && handleStatusChange(selectedTenant, newStatus, reason, notes)}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {newStatus.toLowerCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

