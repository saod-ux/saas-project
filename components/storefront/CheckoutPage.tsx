"use client";

interface CheckoutPageProps {
  tenant: any;
  tenantSlug: string;
}

export default function CheckoutPage({ tenant, tenantSlug }: CheckoutPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          The checkout process will be implemented in the next phase.
        </p>
        <a
          href={`/${tenantSlug}/cart`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Cart
        </a>
      </div>
    </div>
  );
}

