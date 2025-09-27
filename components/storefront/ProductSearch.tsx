'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import ProductCard from './ProductCard';

interface SearchFilters {
  categories: any[];
  priceRange: { min: number; max: number };
  tags: string[];
}

interface SearchResult {
  products: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  suggestions?: string[];
}

interface ProductSearchProps {
  tenantSlug: string;
  initialQuery?: string;
  initialCategory?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialSortBy?: string;
  initialSortOrder?: string;
  initialPage?: number;
}

export default function ProductSearch({
  tenantSlug,
  initialQuery = '',
  initialCategory = '',
  initialMinPrice,
  initialMaxPrice,
  initialSortBy = 'name',
  initialSortOrder = 'asc',
  initialPage = 1
}: ProductSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [page, setPage] = useState(initialPage);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Fetch search filters
  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/search/filters`);
      const data = await response.json();
      
      if (data.ok) {
        setFilters(data.data);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  }, [tenantSlug]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string = query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (searchQuery) params.set('q', searchQuery);
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);
      params.set('page', page.toString());
      params.set('limit', '12');

      const response = await fetch(`/api/storefront/${tenantSlug}/search?${params}`);
      const data = await response.json();
      
      if (data.ok) {
        setSearchResult(data.data);
        setSuggestions(data.data.suggestions || []);
      } else {
        toast.error('Search failed');
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, query, category, minPrice, maxPrice, sortBy, sortOrder, page]);

  // Update URL with current search parameters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy !== 'name') params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', page.toString());

    const newURL = `/${tenantSlug}/search${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newURL);
  }, [tenantSlug, query, category, minPrice, maxPrice, sortBy, sortOrder, page, router]);

  // Handle search
  const handleSearch = () => {
    setPage(1);
    performSearch();
    updateURL();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setPage(1);
    performSearch();
    updateURL();
  };

  // Clear filters
  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
    performSearch('');
    updateURL();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setPage(1);
    performSearch(suggestion);
    updateURL();
  };

  // Load initial data
  useEffect(() => {
    fetchFilters();
    performSearch();
  }, []);

  // Update search when page changes
  useEffect(() => {
    if (page !== initialPage) {
      performSearch();
      updateURL();
    }
  }, [page]);

  const hasActiveFilters = query || category || minPrice || maxPrice || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Products</h1>
        <p className="text-gray-600">Find exactly what you're looking for</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
              {suggestions.length > 0 && query && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={category} onValueChange={(value) => {
                  setCategory(value);
                  handleFilterChange();
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {filters?.categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Price</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={handleFilterChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Price</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={handleFilterChange}
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                  handleFilterChange();
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="price-asc">Price Low to High</SelectItem>
                    <SelectItem value="price-desc">Price High to Low</SelectItem>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Query: {query}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                setQuery('');
                handleFilterChange();
              }} />
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters?.categories.find((c: any) => c.id === category)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                setCategory('');
                handleFilterChange();
              }} />
            </Badge>
          )}
          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {minPrice || '0'} - {maxPrice || '∞'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                setMinPrice('');
                setMaxPrice('');
                handleFilterChange();
              }} />
            </Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : searchResult ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {searchResult.total} product{searchResult.total !== 1 ? 's' : ''} found
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Page {searchResult.page} of {searchResult.totalPages}</span>
              </div>
            </div>

            {searchResult.products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResult.products.map((product) => (
                    <ProductCard key={product.id} product={product} tenantSlug={tenantSlug} />
                  ))}
                </div>

                {/* Pagination */}
                {searchResult.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={!searchResult.hasPrev}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    
                    {[...Array(Math.min(5, searchResult.totalPages))].map((_, i) => {
                      const pageNum = Math.max(1, Math.min(searchResult.totalPages - 4, page - 2)) + i;
                      if (pageNum > searchResult.totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      disabled={!searchResult.hasNext}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or browse our categories
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

