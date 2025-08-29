import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'

// GET /api/v1/images/[key] - Proxy images from R2
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }
    
    const tenant = await resolveTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const imageKey = decodeURIComponent(params.key)
    
    // Construct the R2 URL
    const r2Url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${imageKey}`
    
    // Fetch the image from R2
    const response = await fetch(r2Url, {
      headers: {
        // Add any required headers for R2 access
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)'
      }
    })
    
    if (!response.ok) {
      console.error('Failed to fetch image from R2:', r2Url, response.status, response.statusText)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
