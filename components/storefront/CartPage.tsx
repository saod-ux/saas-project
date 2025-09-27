"use client";

interface CartPageProps {
  tenant: any;
  tenantSlug: string;
}

export default function CartPage({ tenant, tenantSlug }: CartPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-6">
          Add some products to your cart to get started.
        </p>
        <a
          href={`/${tenantSlug}/categories`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

