"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, Clock, ExternalLink, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Domain {
  id: string;
  domain: string;
  dnsStatus: string;
  sslStatus: string;
  verified: boolean;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Merchant {
  id: string;
  name: string;
  slug: string;
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

export default function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');

  useEffect(() => {
    fetchDomains();
    fetchMerchants();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/platform/domains');
      const data = await response.json();
      if (data.ok) {
        setDomains(data.data);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/platform/merchants');
      const data = await response.json();
      if (data.ok) {
        setMerchants(data.data);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      toast.error('Failed to fetch merchants');
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim() || !selectedMerchant) return;

    setAdding(true);
    try {
      const response = await fetch('/api/platform/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newDomain,
          tenantSlug: selectedMerchant,
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        toast.success('Domain added successfully');
        setNewDomain('');
        setSelectedMerchant('');
        setIsDialogOpen(false);
        fetchDomains();
      } else {
        toast.error(data.error || 'Failed to add domain');
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifying(domainId);
    try {
      const response = await fetch(`/api/platform/domains/${domainId}/verify`, {
        method: 'PUT',
      });

      const data = await response.json();
      
      if (data.ok) {
        toast.success('Domain verification completed');
        fetchDomains();
      } else {
        toast.error(data.error || 'Failed to verify domain');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error('Failed to verify domain');
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domain Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Add and manage custom domains for merchants
              </p>
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
                    Add a custom domain for a merchant
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="merchant">Merchant</Label>
                    <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a merchant" />
                      </SelectTrigger>
                      <SelectContent>
                        {merchants.map((merchant) => (
                          <SelectItem key={merchant.id} value={merchant.slug}>
                            {merchant.name} ({merchant.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="shop.example.com"
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
                  <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim() || !selectedMerchant}>
                    {adding ? 'Adding...' : 'Add Domain'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No domains yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add custom domains for merchants to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNS Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SSL Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Checked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domains.map((domain) => {
                    const dnsStatus = statusConfig[domain.dnsStatus as keyof typeof statusConfig] || statusConfig.PENDING;
                    const sslStatus = sslStatusConfig[domain.sslStatus as keyof typeof sslStatusConfig] || sslStatusConfig.NONE;
                    const DnsIcon = dnsStatus.icon;

                    return (
                      <tr key={domain.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{domain.domain}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{domain.tenant.name}</div>
                          <div className="text-sm text-gray-500">/{domain.tenant.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${dnsStatus.color} inline-flex items-center`}>
                            <DnsIcon className="h-3 w-3 mr-1" />
                            {dnsStatus.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={sslStatus.color}>
                            {sslStatus.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {domain.lastCheckedAt ? new Date(domain.lastCheckedAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDomain(domain.id)}
                              disabled={verifying === domain.id}
                            >
                              {verifying === domain.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={`/${domain.tenant.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






