export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">How do I place an order?</h3>
              <p className="text-gray-600">
                Simply browse our products, add items to your cart, and proceed to checkout.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards and digital payment methods.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">How long does delivery take?</h3>
              <p className="text-gray-600">
                Delivery times vary by location, typically 2-5 business days.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Can I return items?</h3>
              <p className="text-gray-600">
                Yes, we offer a 30-day return policy for most items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}