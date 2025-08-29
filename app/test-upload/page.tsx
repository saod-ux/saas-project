'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'

export default function TestUploadPage() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [authResult, setAuthResult] = useState<any>(null)
  const [simpleResult, setSimpleResult] = useState<any>(null)
  const [attachResult, setAttachResult] = useState<any>(null)

  const testAuth = async () => {
    if (!isSignedIn || !userId) return
    
    try {
      const res = await fetch('/api/v1/test-auth', {
        headers: {
          'x-tenant-slug': 'acme'
        }
      })
      
      const data = await res.json()
      setAuthResult(data)
      console.log('Auth test result:', data)
    } catch (error: any) {
      console.error('Error testing auth:', error)
      setAuthResult({ error: error.message })
    }
  }

  const testSimple = async () => {
    if (!isSignedIn || !userId) return
    
    try {
      const res = await fetch('/api/v1/test-simple', {
        headers: {
          'x-tenant-slug': 'acme'
        }
      })
      
      const data = await res.json()
      setSimpleResult(data)
      console.log('Simple test result:', data)
    } catch (error: any) {
      console.error('Error testing simple:', error)
      setSimpleResult({ error: error.message })
    }
  }

  const testPresign = async () => {
    if (!isSignedIn || !userId) return
    
    setUploading(true)
    try {
      const res = await fetch('/api/v1/uploads/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': 'acme'
        },
        body: JSON.stringify({
          fileName: 'test.jpg',
          fileType: 'image/jpeg'
        })
      })
      
      const data = await res.json()
      setResult(data)
      console.log('Presign result:', data)
      
      // If presign was successful, test attach
      if (data.data && data.data.key) {
        await testAttach(data.data.key)
      }
    } catch (error: any) {
      console.error('Error testing presign:', error)
      setResult({ error: error.message })
    } finally {
      setUploading(false)
    }
  }

  const testAttach = async (fileKey: string) => {
    if (!isSignedIn || !userId) return
    
    try {
      const res = await fetch('/api/v1/uploads/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': 'acme'
        },
        body: JSON.stringify({
          key: fileKey,
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024 * 1024, // 1MB
          // productId: 'optional-product-id' // Uncomment to attach to a product
        })
      })
      
      const data = await res.json()
      setAttachResult(data)
      console.log('Attach result:', data)
    } catch (error: any) {
      console.error('Error testing attach:', error)
      setAttachResult({ error: error.message })
    }
  }

  if (!isSignedIn) {
    return <div>Please sign in first</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Upload Flow</h1>
      <p className="mb-4">User: {user?.fullName} ({user?.primaryEmailAddress?.emailAddress})</p>
      <p className="mb-4">User ID: {userId}</p>
      
      <div className="space-y-4">
        <button
          onClick={testSimple}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Test Simple Auth
        </button>
        
        <button
          onClick={testAuth}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Auth Endpoint
        </button>
        
        <button
          onClick={testPresign}
          disabled={uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? 'Testing...' : 'Test Presign Endpoint'}
        </button>
      </div>
      
      {simpleResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Simple Auth Result:</h3>
          <pre className="text-sm">{JSON.stringify(simpleResult, null, 2)}</pre>
        </div>
      )}
      
      {authResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Auth Result:</h3>
          <pre className="text-sm">{JSON.stringify(authResult, null, 2)}</pre>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Presign Result:</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {attachResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Attach Result:</h3>
          <pre className="text-sm">{JSON.stringify(attachResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
