import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/firebase/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HeroSettings {
  enabled: boolean;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface PolicySettings {
  returnPolicy: {
    enabled: boolean;
    title: string;
    content: string;
  };
  aboutUs: {
    enabled: boolean;
    title: string;
    content: string;
  };
}

interface ContentSettings {
  hero: HeroSettings;
  policies: PolicySettings;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const db = await getServerDb();
    
    // Get content settings from platform collection
    const contentDoc = await db.collection('platform').doc('content-settings').get();
    
    if (!contentDoc.exists) {
      // Return default settings if document doesn't exist
      const defaultSettings: ContentSettings = {
        hero: {
          enabled: false,
          title: "Welcome to Our Store",
          description: "Discover amazing products at great prices",
          ctaText: "Shop Now",
          ctaLink: "/categories"
        },
        policies: {
          returnPolicy: {
            enabled: false,
            title: "Return & Exchange Policy",
            content: "We offer a 30-day return policy for all items in original condition..."
          },
          aboutUs: {
            enabled: false,
            title: "About Us",
            content: "We are a leading online retailer committed to providing quality products and excellent customer service..."
          }
        },
        updatedAt: new Date().toISOString()
      };
      
      return NextResponse.json({ ok: true, settings: defaultSettings });
    }
    
    const data = contentDoc.data();
    const settings: ContentSettings = {
      hero: data?.hero || {
        enabled: false,
        title: "Welcome to Our Store",
        description: "Discover amazing products at great prices",
        ctaText: "Shop Now",
        ctaLink: "/categories"
      },
      policies: data?.policies || {
        returnPolicy: {
          enabled: false,
          title: "Return & Exchange Policy",
          content: "We offer a 30-day return policy for all items in original condition..."
        },
        aboutUs: {
          enabled: false,
          title: "About Us",
          content: "We are a leading online retailer committed to providing quality products and excellent customer service..."
        }
      },
      updatedAt: data?.updatedAt?.seconds ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString()
    };
    
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("Error fetching content settings:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch content settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getServerDb();
    
    // Validate the request body
    if (!body.hero || !body.policies) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body. Missing hero or policies data." },
        { status: 400 }
      );
    }
    
    // Update content settings in platform collection
    await db.collection('platform').doc('content-settings').set({
      hero: body.hero,
      policies: body.policies,
      updatedAt: new Date(),
    }, { merge: true });
    
    return NextResponse.json({ ok: true, message: "Content settings updated successfully" });
  } catch (error) {
    console.error("Error updating content settings:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update content settings" },
      { status: 500 }
    );
  }
}

