"use client"

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface Member {
  id: string
  userId: string
  role: string
  status: string
  user: {
    id: string
    email: string
    name?: string | null
  }
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

export default function AdminTeamPage() {
  const { isSignedIn, isLoaded, userId } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

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

  async function loadMembers() {
    if (!isSignedIn || !tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/members', { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${userId}`,
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load')
      setMembers(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      loadMembers()
    }
  }, [isSignedIn, tenantSlug])

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>
  }

  if (!isSignedIn) {
    return <div className="p-6">Redirecting to sign in...</div>
  }

  if (!tenantSlug) {
    return <div className="p-6">No tenant found. Please access via subdomain like acme.localhost:3001</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Team - {tenantSlug}</h1>
        <Button onClick={() => alert('Invite functionality coming soon!')}>Invite Member</Button>
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
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-3 py-2">{member.user.name || 'No name'}</td>
                  <td className="px-3 py-2">{member.user.email}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.role === 'OWNER' ? 'bg-red-100 text-red-800' :
                      member.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' :
                      member.role === 'STAFF' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      member.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {members.length === 0 && !loading && !error && (
        <p className="text-gray-500">No team members found. You may need to register first.</p>
      )}
    </div>
  )
}
