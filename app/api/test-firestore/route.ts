import { NextRequest, NextResponse } from 'next/server';
import { getTenantDocuments, createDocument, COLLECTIONS } from '@/lib/firebase/db';
import { createTenant } from '@/lib/firebase/tenant';

export async function GET(request: NextRequest) {
  try {
    // Test Firestore connection
    console.log('Testing Firestore connection...');
    
    // Try to get tenants
    const tenants = await getTenantDocuments(COLLECTIONS.TENANTS, 'all');
    console.log('Found tenants:', tenants.length);
    
    return NextResponse.json({
      ok: true,
      message: 'Firestore connection successful',
      tenantsCount: tenants.length,
      tenants: tenants.slice(0, 3) // Show first 3 tenants
    });
  } catch (error) {
    console.error('Firestore test error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Firestore connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug } = body;
    
    if (!name || !slug) {
      return NextResponse.json({
        ok: false,
        error: 'Name and slug are required'
      }, { status: 400 });
    }
    
    // Create a test tenant using the tenant function
    const tenant = await createTenant({
      name,
      slug,
      domain: null,
      settingsJson: {
        theme: 'default',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b'
        }
      }
    });
    
    return NextResponse.json({
      ok: true,
      message: 'Test tenant created successfully',
      tenant
    });
  } catch (error) {
    console.error('Firestore create test error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to create test tenant',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
