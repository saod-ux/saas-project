'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NoTenantPage() {
  const router = useRouter()
  const [tenantSlug, setTenantSlug] = useState('')

  const handleDevOverride = () => {
    if (tenantSlug.trim()) {
      router.push(`/?tenant=${tenantSlug.trim()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-900 mb-2">
              No Tenant Found
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              This domain is not associated with any tenant
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How to Access a Store</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use the tenant&apos;s custom domain (e.g., <code>acme.com</code>)</li>
                <li>• In development, use <code>?tenant=acme</code> parameter</li>
                <li>• Contact your administrator to set up a custom domain</li>
              </ul>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div className="text-center space-y-3">
                <div className="flex gap-2 max-w-sm mx-auto">
                  <Input
                    type="text"
                    placeholder="Enter tenant slug..."
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleDevOverride()}
                  />
                  <Button onClick={handleDevOverride} disabled={!tenantSlug.trim()}>
                    Go
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Only available in development mode
                </p>
              </div>
            )}

            <div className="text-center">
              <Button onClick={() => router.push('/sign-in')} variant="default">
                Sign In to Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
