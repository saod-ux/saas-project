import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/services/tenant";
import { getTenantDocuments, createDocument } from "@/lib/db";
import { requireTenantAndRole } from "@/lib/rbac";
import { enforceLimit } from "@/lib/limits";
import { ok, badRequest, errorResponse } from '@/lib/http/responses';
import { validateBody, schemas } from '@/lib/validation';
import { withProductCreationRules, validateBusinessRule, BusinessRules } from '@/lib/business-rules';
import { normalizeNumericInput } from '@/lib/utils/arabic-numerals';

// Use the comprehensive product schema from our validation system
const CreateProductSchema = schemas.CreateProduct;

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    // Get products from Firebase
    const products = await getTenantDocuments('products', tenant.id);
    
    // Sort by createdAt descending
    const sortedProducts = products.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bTime.getTime() - aTime.getTime();
    });

    // Add computed primaryImageUrl field
    const productsWithPrimaryImage = sortedProducts.map((product: any) => ({
      ...product,
      primaryImageUrl: product.imageUrl || (product.gallery && product.gallery[0]) || null,
    }));

    return ok(productsWithPrimaryImage);
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch products");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    // Parse and validate request body
    const body = await request.json();
    console.log('Received product data:', body);
    
    // Standardize to 'name' field (products use 'name', not 'title')
    const productName = body.name || body.title;
    
    // Normalize numeric inputs (handle Arabic numerals)
    const normalizedPrice = normalizeNumericInput(body.price?.toString() || '0');
    const normalizedCompareAtPrice = body.compareAtPrice ? normalizeNumericInput(body.compareAtPrice.toString()) : null;
    const normalizedCostPrice = body.costPrice ? normalizeNumericInput(body.costPrice.toString()) : null;
    const normalizedWeight = body.weight ? normalizeNumericInput(body.weight.toString()) : null;
    const normalizedQuantity = normalizeNumericInput(body.inventory?.quantity?.toString() || '0');
    
    // Basic validation
    if (!productName || isNaN(normalizedPrice)) {
      return badRequest('Product name and valid price are required');
    }

    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
            const productData = {
              id: productId,
              tenantId: tenant.id,
              name: productName,
              nameAr: body.nameAr || null,
              description: body.description || '',
              price: normalizedPrice,
              compareAtPrice: normalizedCompareAtPrice,
              costPrice: normalizedCostPrice,
              sku: body.sku || '',
              barcode: body.barcode || '',
              weight: normalizedWeight,
              dimensions: body.dimensions || null,
              status: (body.status || 'draft').toLowerCase(),
              visibility: body.visibility || 'public',
              stockQuantity: body.stockQuantity || 0,
              lowStockThreshold: body.lowStockThreshold || 5,
              inventory: {
                quantity: Math.floor(normalizedQuantity),
                trackInventory: body.inventory?.trackInventory !== false,
                allowOutOfStockPurchases: body.inventory?.allowOutOfStockPurchases === true,
              },
              images: body.images || [],
              gallery: body.gallery || [],
              primaryCategoryId: body.primaryCategoryId || null,
              categories: body.categories || [],
              tags: body.tags || [],
              isBestSeller: body.isBestSeller === true,
              isNewArrival: body.isNewArrival === true,
              isFeatured: body.isFeatured === true,
              seo: body.seo || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

    console.log('Creating product with data:', productData);
    const product = await createDocument('products', productData);

    return ok(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to create product");
  }
}
