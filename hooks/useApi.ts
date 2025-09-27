import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API Response type
interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Generic API fetch function
async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await response.json();
  return data;
}

// Query Keys
export const queryKeys = {
  tenant: (slug: string) => ['tenant', slug] as const,
  categories: (tenantId: string) => ['categories', tenantId] as const,
  products: (tenantId: string, params?: any) => ['products', tenantId, params] as const,
  product: (productId: string) => ['product', productId] as const,
  settings: (tenantId: string) => ['settings', tenantId] as const,
};

// Tenant hooks
export function useTenant(slug: string) {
  return useQuery({
    queryKey: queryKeys.tenant(slug),
    queryFn: () => apiFetch(`/api/tenants/${slug}`),
    enabled: !!slug,
  });
}

// Categories hooks
export function useCategories(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.categories(tenantId),
    queryFn: () => apiFetch(`/api/admin/${tenantId}/categories`),
    enabled: !!tenantId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, data }: { tenantSlug: string; data: any }) =>
      apiFetch(`/api/admin/${tenantSlug}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { tenantSlug }) => {
      // Invalidate categories query
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, categoryId, data }: { tenantSlug: string; categoryId: string; data: any }) =>
      apiFetch(`/api/admin/${tenantSlug}/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { tenantSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, categoryId }: { tenantSlug: string; categoryId: string }) =>
      apiFetch(`/api/admin/${tenantSlug}/categories/${categoryId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { tenantSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Products hooks
export function useProducts(tenantId: string, params?: any) {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  return useQuery({
    queryKey: queryKeys.products(tenantId, params),
    queryFn: () => apiFetch(`/api/admin/${tenantId}/products?${searchParams}`),
    enabled: !!tenantId,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: () => apiFetch(`/api/products/${productId}`),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, data }: { tenantSlug: string; data: any }) =>
      apiFetch(`/api/admin/${tenantSlug}/products`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { tenantSlug }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, productId, data }: { tenantSlug: string; productId: string; data: any }) =>
      apiFetch(`/api/admin/${tenantSlug}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, productId }: { tenantSlug: string; productId: string }) =>
      apiFetch(`/api/admin/${tenantSlug}/products/${productId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Settings hooks
export function useSettings(tenantSlug: string) {
  return useQuery({
    queryKey: queryKeys.settings(tenantSlug),
    queryFn: () => apiFetch(`/api/admin/${tenantSlug}/settings`),
    enabled: !!tenantSlug,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantSlug, data }: { tenantSlug: string; data: any }) =>
      apiFetch(`/api/admin/${tenantSlug}/settings`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { tenantSlug }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings(tenantSlug) });
    },
  });
}

// Storefront hooks
export function useStorefrontProducts(tenantSlug: string, params?: any) {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  return useQuery({
    queryKey: ['storefront-products', tenantSlug, params],
    queryFn: () => apiFetch(`/api/storefront/${tenantSlug}/products?${searchParams}`),
    enabled: !!tenantSlug,
  });
}

export function useStorefrontCategories(tenantSlug: string) {
  return useQuery({
    queryKey: ['storefront-categories', tenantSlug],
    queryFn: () => apiFetch(`/api/storefront/${tenantSlug}/categories`),
    enabled: !!tenantSlug,
  });
}

