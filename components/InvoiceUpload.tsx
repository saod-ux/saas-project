'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface InvoiceUploadResult {
  fileId: string
  signedUrl?: string
  expiresAt?: Date
  message: string
}

export default function InvoiceUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<InvoiceUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      // Upload via API route
      const response = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadType: 'invoice',
          fileData: base64Data
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadResult = await response.json()
      setResult(uploadResult.data)
      
      console.log('Invoice upload successful:', uploadResult.data)
    } catch (error: any) {
      setError(error.message)
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatExpiry = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Invoice Upload Test</CardTitle>
        <CardDescription>
          Test uploading files to the private invoices bucket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="invoice-file" className="text-sm font-medium">
            Select Invoice File
          </label>
          <Input
            id="invoice-file"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {file && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {file.type}
            </p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Invoice'}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2">Upload Result</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">File ID:</span>
                  <Badge variant="secondary" className="ml-2">
                    {result.fileId}
                  </Badge>
                </div>
                
                {result.signedUrl && (
                  <div>
                    <span className="font-medium">Signed URL:</span>
                    <div className="mt-1">
                      <a
                        href={result.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs break-all"
                      >
                        {result.signedUrl}
                      </a>
                    </div>
                  </div>
                )}
                
                {result.expiresAt && (
                  <div>
                    <span className="font-medium">Expires:</span>
                    <span className="ml-2 text-gray-600">
                      {formatExpiry(result.expiresAt)}
                    </span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">Message:</span>
                  <span className="ml-2 text-gray-600">{result.message}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}








