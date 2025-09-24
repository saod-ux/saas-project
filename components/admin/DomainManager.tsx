"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, ExternalLink, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Domain {
  id: string
  domain: string
  dnsStatus: 'PENDING' | 'VERIFIED' | 'INVALID'
  sslStatus: 'NONE' | 'PENDING' | 'ACTIVE' | 'ERROR'
  verified: boolean
  verifiedAt?: string
  lastCheckedAt?: string
  createdAt: string
}

interface DomainManagerProps {
  tenantSlug: string
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  VERIFIED: {
    label: 'Verified',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  INVALID: {
    label: 'Invalid',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

const sslStatusConfig = {
  NONE: {
    label: 'No SSL',
    color: 'bg-gray-100 text-gray-800'
  },
  PENDING: {
    label: 'SSL Pending',
    color: 'bg-yellow-100 text-yellow-800'
  },
  ACTIVE: {
    label: 'SSL Active',
    color: 'bg-green-100 text-green-800'
  },
  ERROR: {
    label: 'SSL Error',
    color: 'bg-red-100 text-red-800'
  }
}

export default function DomainManager({ tenantSlug }: DomainManagerProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchDomains = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/domains`)
      const data = await response.json()
      if (data.ok) {
        setDomains(data.data)
      }
    } catch (error) {
      console.error('Error fetching domains:', error)
      toast.error('Failed to fetch domains')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    fetchDomains()
  }, [tenantSlug, fetchDomains])

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    setAdding(true)
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      })

      const data = await response.json()
      if (data.ok) {
        toast.success('Domain added successfully')
        setNewDomain('')
        setIsDialogOpen(false)
        fetchDomains()
      } else {
        toast.error(data.error || 'Failed to add domain')
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error('Failed to add domain')
    } finally {
      setAdding(false)
    }
  }

  const handleVerifyDomain = async (domain: string) => {
    setVerifying(domain)
    try {
      const response = await fetch(`/api/admin/${tenantSlug}/domains`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, verificationMethod: 'dns' })
      })

      const data = await response.json()
      if (data.ok) {
        toast.success(data.message)
        fetchDomains()
      } else {
        toast.error(data.error || 'Domain verification failed')
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      toast.error('Failed to verify domain')
    } finally {
      setVerifying(null)
    }
  }

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    )
  }

  const getSslStatusBadge = (status: string) => {
    const config = sslStatusConfig[status as keyof typeof sslStatusConfig]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>Manage your custom domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading domains...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Domains</CardTitle>
            <CardDescription>Connect your custom domain to your store</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
                <DialogDescription>
                  Enter your custom domain (e.g., shop.yourstore.com)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="shop.yourstore.com"
                  />
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    After adding the domain, you&apos;ll need to configure DNS records to verify ownership.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()}>
                  {adding ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {domains.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ExternalLink className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No custom domains</h3>
            <p className="text-gray-500 mb-4">Add a custom domain to give your store a professional look</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Domain
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{domain.domain}</div>
                      <div className="text-sm text-gray-500">
                        Added {new Date(domain.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(domain.dnsStatus)}
                    {getSslStatusBadge(domain.sslStatus)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyDomain(domain.domain)}
                      disabled={verifying === domain.domain}
                    >
                      {verifying === domain.domain ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {domain.verified && domain.verifiedAt && (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Verified on {new Date(domain.verifiedAt).toLocaleDateString()}
                  </div>
                )}
                
                {domain.dnsStatus === 'INVALID' && (
                  <div className="mt-2 text-sm text-red-600">
                    ✗ DNS verification failed. Please check your DNS settings.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">DNS Configuration</h4>
          <p className="text-sm text-blue-700 mb-2">
            To verify your domain, add the following DNS record:
          </p>
          <div className="bg-white p-3 rounded border font-mono text-sm">
            <div>Type: CNAME</div>
            <div>Name: {domains[0]?.domain || 'your-domain.com'}</div>
            <div>Value: platform.vercel.app</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


