// Mock subscription plans - in a real app, these would come from your billing system
const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic",
    price: 29,
    interval: "month",
    features: ["Up to 100 products", "Basic analytics", "Email support"],
    merchantCount: 45,
    revenue: 1305
  },
  {
    id: "pro",
    name: "Pro", 
    price: 79,
    interval: "month",
    features: ["Unlimited products", "Advanced analytics", "Priority support", "Custom domain"],
    merchantCount: 28,
    revenue: 2212
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    interval: "month", 
    features: ["Everything in Pro", "White-label", "API access", "Dedicated support"],
    merchantCount: 5,
    revenue: 995
  }
];

export default function SubscriptionPlans() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Subscription Plans</h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${plan.price}
                  </div>
                  <div className="text-sm text-gray-500">per {plan.interval}</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Merchants:</span>
                  <span className="font-medium">{plan.merchantCount}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium">${plan.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


