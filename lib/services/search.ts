/**
 * Advanced Search Service
 * 
 * Handles product search with filters, sorting, and pagination
 */

import { getTenantDocuments } from '@/lib/db';
import { log } from '@/lib/logger';

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: 'active' | 'inactive' | 'draft';
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  filters: SearchFilters;
  suggestions?: string[];
}

export class SearchService {
  /**
   * Search products with advanced filtering and sorting
   */
  static async searchProducts(
    tenantId: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult> {
    const logger = log.child({ 
      service: 'SearchService', 
      method: 'searchProducts', 
      tenantId, 
      filters 
    });
    
    try {
      const {
        query = '',
        categoryId,
        minPrice,
        maxPrice,
        status = 'active',
        inStock,
        tags = [],
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = filters;

      // Get all products for the tenant
      const allProducts = await getTenantDocuments('products', tenantId);
      
      // Apply filters
      let filteredProducts = allProducts.filter((product: any) => {
        // Status filter
        if (product.status !== status) return false;
        
        // Category filter
        if (categoryId && product.primaryCategoryId !== categoryId) return false;
        
        // Price range filter
        if (minPrice !== undefined && product.price < minPrice) return false;
        if (maxPrice !== undefined && product.price > maxPrice) return false;
        
        // Stock filter
        if (inStock !== undefined) {
          const hasStock = product.stockQuantity > 0;
          if (inStock && !hasStock) return false;
          if (!inStock && hasStock) return false;
        }
        
        // Tags filter
        if (tags.length > 0) {
          const productTags = product.tags || [];
          const hasMatchingTag = tags.some(tag => 
            productTags.some((productTag: string) => 
              productTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasMatchingTag) return false;
        }
        
        // Text search filter
        if (query) {
          const searchTerm = query.toLowerCase();
          const searchableFields = [
            product.name,
            product.nameAr,
            product.description,
            product.sku,
            ...(product.tags || [])
          ];
          
          const matchesSearch = searchableFields.some(field => 
            field && field.toLowerCase().includes(searchTerm)
          );
          
          if (!matchesSearch) return false;
        }
        
        return true;
      });

      // Sort products
      filteredProducts.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          case 'updatedAt':
            aValue = new Date(a.updatedAt || 0).getTime();
            bValue = new Date(b.updatedAt || 0).getTime();
            break;
          case 'popularity':
            // Simple popularity based on order count (would need order data)
            aValue = a.orderCount || 0;
            bValue = b.orderCount || 0;
            break;
          default:
            aValue = a.name?.toLowerCase() || '';
            bValue = b.name?.toLowerCase() || '';
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Pagination
      const total = filteredProducts.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      // Generate search suggestions (simple implementation)
      const suggestions = this.generateSuggestions(query, allProducts);

      const result: SearchResult = {
        products: paginatedProducts,
        total,
        page,
        limit,
        totalPages,
        hasNext: endIndex < total,
        hasPrev: page > 1,
        filters,
        suggestions
      };

      logger.info('Product search completed', { 
        totalResults: total, 
        returnedResults: paginatedProducts.length,
        page,
        totalPages
      });

      return result;
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Generate search suggestions based on query and products
   */
  private static generateSuggestions(query: string, products: any[]): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add product names that start with the query
    products.forEach((product: any) => {
      if (product.name?.toLowerCase().startsWith(queryLower)) {
        suggestions.add(product.name);
      }
      if (product.nameAr?.toLowerCase().startsWith(queryLower)) {
        suggestions.add(product.nameAr);
      }
    });

    // Add category names
    // This would require fetching categories, but for now we'll skip

    // Add tags
    products.forEach((product: any) => {
      (product.tags || []).forEach((tag: string) => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Get popular search terms (mock implementation)
   */
  static async getPopularSearches(tenantId: string): Promise<string[]> {
    // In a real implementation, this would track search analytics
    return [
      'electronics',
      'clothing',
      'home',
      'garden',
      'laptops'
    ];
  }

  /**
   * Get search filters metadata
   */
  static async getSearchFilters(tenantId: string): Promise<{
    categories: any[];
    priceRange: { min: number; max: number };
    tags: string[];
  }> {
    const logger = log.child({ 
      service: 'SearchService', 
      method: 'getSearchFilters', 
      tenantId 
    });
    
    try {
      const [products, categories] = await Promise.all([
        getTenantDocuments('products', tenantId),
        getTenantDocuments('categories', tenantId)
      ]);

      // Calculate price range
      const prices = products
        .filter((p: any) => p.price && p.status === 'active')
        .map((p: any) => p.price);
      
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 1000
      };

      // Get unique tags
      const allTags = new Set<string>();
      products.forEach((product: any) => {
        (product.tags || []).forEach((tag: string) => allTags.add(tag));
      });

      const result = {
        categories,
        priceRange,
        tags: Array.from(allTags)
      };

      logger.info('Search filters metadata generated', { 
        categoryCount: categories.length,
        tagCount: result.tags.length,
        priceRange
      });

      return result;
    } catch (error) {
      logger.error('Error getting search filters:', error);
      throw error;
    }
  }
}

