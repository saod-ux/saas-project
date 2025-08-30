import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'
import { prismaRO } from '@/lib/db'
import { z } from 'zod'

const testPaymentSchema = z.object({
  gateway: z.enum(['myfatoorah', 'knet', 'stripe'])
})

// POST /api/v1/settings/test-payment - Test payment gateway connection
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = testPaymentSchema.parse(body)

    let testResult = { success: false, message: '' }

    switch (validatedData.gateway) {
      case 'myfatoorah':
        if (!tenant.myfatoorahApiKey || !tenant.myfatoorahSecretKey) {
          testResult = { 
            success: false, 
            message: 'MyFatoorah API credentials not configured' 
          }
        } else {
          // Test MyFatoorah connection
          testResult = await testMyFatoorahConnection(tenant)
        }
        break

      case 'knet':
        if (!tenant.knetMerchantId || !tenant.knetApiKey) {
          testResult = { 
            success: false, 
            message: 'KNET credentials not configured' 
          }
        } else {
          // Test KNET connection
          testResult = await testKNETConnection(tenant)
        }
        break

      case 'stripe':
        if (!tenant.stripePublishableKey || !tenant.stripeSecretKey) {
          testResult = { 
            success: false, 
            message: 'Stripe credentials not configured' 
          }
        } else {
          // Test Stripe connection
          testResult = await testStripeConnection(tenant)
        }
        break

      default:
        testResult = { success: false, message: 'Invalid payment gateway' }
    }

    if (testResult.success) {
      return NextResponse.json({ 
        success: true, 
        message: testResult.message 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: testResult.message 
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Payment test error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test MyFatoorah connection
async function testMyFatoorahConnection(tenant: any) {
  try {
    const baseUrl = tenant.myfatoorahIsTest 
      ? 'https://apitest.myfatoorah.com' 
      : 'https://api.myfatoorah.com'
    
    // Test with a simple API call (get payment methods)
    const response = await fetch(`${baseUrl}/v2/GetPaymentMethods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenant.myfatoorahApiKey}`
      },
      body: JSON.stringify({
        InvoiceAmount: 100,
        CurrencyIso: 'KWD'
      })
    })

    if (response.ok) {
      return { success: true, message: 'MyFatoorah connection successful' }
    } else {
      const error = await response.text()
      return { success: false, message: `MyFatoorah API error: ${error}` }
    }
  } catch (error) {
    return { success: false, message: `MyFatoorah connection failed: ${error}` }
  }
}

// Test KNET connection
async function testKNETConnection(tenant: any) {
  try {
    // KNET typically uses a different testing approach
    // For now, just validate the credentials format
    if (tenant.knetMerchantId.length < 5) {
      return { success: false, message: 'Invalid KNET Merchant ID format' }
    }
    
    if (tenant.knetApiKey.length < 10) {
      return { success: false, message: 'Invalid KNET API Key format' }
    }

    return { success: true, message: 'KNET credentials format valid' }
  } catch (error) {
    return { success: false, message: `KNET validation failed: ${error}` }
  }
}

// Test Stripe connection
async function testStripeConnection(tenant: any) {
  try {
    const baseUrl = tenant.stripeIsTest 
      ? 'https://api.stripe.com' 
      : 'https://api.stripe.com'
    
    // Test with a simple API call (get account info)
    const response = await fetch(`${baseUrl}/v1/account`, {
      headers: {
        'Authorization': `Bearer ${tenant.stripeSecretKey}`
      }
    })

    if (response.ok) {
      return { success: true, message: 'Stripe connection successful' }
    } else {
      const error = await response.text()
      return { success: false, message: `Stripe API error: ${error}` }
    }
  } catch (error) {
    return { success: false, message: `Stripe connection failed: ${error}` }
  }
}
