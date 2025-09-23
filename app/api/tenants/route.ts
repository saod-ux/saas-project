import { NextRequest, NextResponse } from 'next/server'
import { createTenant, isSlugAvailable } from '@/lib/tenants'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, template } = body

    // Validate required fields
    if (!name || !slug || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, template' },
        { status: 400 }
      )
    }

    // Validate template
    if (!['RESTAURANT', 'RETAIL'].includes(template)) {
      return NextResponse.json(
        { error: 'Invalid template. Must be RESTAURANT or RETAIL' },
        { status: 400 }
      )
    }

    // Normalize slug to kebab-case
    const normalizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    if (!normalizedSlug) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    // Check if slug is available
    const slugAvailable = await isSlugAvailable(normalizedSlug)
    if (!slugAvailable) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 409 }
      )
    }

    // TODO: Add authentication/authorization here
    // For now, allow all requests in development
    if (process.env.NODE_ENV === 'production') {
      // In production, validate user authentication
      // const user = await getCurrentUser()
      // if (!user) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      // }
    }

    // Create tenant
    const tenant = await createTenant({
      name: name.trim(),
      slug: normalizedSlug,
      template
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Failed to create tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











