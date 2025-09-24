import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantDocuments, createDocument } from '@/lib/firebase/tenant'
import { requirePlatformRole } from '@/lib/auth'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  currency: z.enum(['KWD', 'USD']).default('KWD'),
  interval: z.enum(['month', 'year']).default('month'),
  features: z.object({
    maxProducts: z.number().min(0).default(0),
    maxCategories: z.number().min(0).default(0),
    maxDomains: z.number().min(0).default(0),
    maxStorage: z.number().min(0).default(0), // in MB
    customDomain: z.boolean().default(false),
    analytics: z.boolean().default(false),
    prioritySupport: z.boolean().default(false),
    apiAccess: z.boolean().default(false),
    whiteLabel: z.boolean().default(false)
  }),
  isActive: z.boolean().default(true)
})

const updatePlanSchema = createPlanSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    
    const allPlans = await getTenantDocuments('plans', '');
    const allSubscriptions = await getTenantDocuments('subscriptions', '');
    
    const plans = allPlans
      .map((plan: any) => {
        const subscriptionCount = allSubscriptions.filter((sub: any) => sub.planId === plan.id).length;
        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          _count: {
            subscriptions: subscriptionCount
          }
        };
      })
      .sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({
      ok: true,
      data: plans
    })

  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    
    const body = await request.json()
    const validatedData = createPlanSchema.parse(body)
    
    const plan = await createDocument('plans', {
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      currency: validatedData.currency,
      interval: validatedData.interval,
      features: validatedData.features,
      isActive: validatedData.isActive,
      createdAt: new Date()
    });

    return NextResponse.json({
      ok: true,
      data: plan,
      message: 'Plan created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating plan:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


