"use client";

import { useState } from "react";

export default function FeatureFlags() {
  const [features, setFeatures] = useState({
    enableAnalytics: true,
    enableCustomDomains: true,
    enableMultiLanguage: true,
    enableAdvancedBilling: false,
    enableWhiteLabel: false,
    enableAPIAccess: false
  });

  const handleSave = () => {
    // In a real app, this would save to your database
    console.log("Saving feature flags:", features);
    alert("Feature flags updated successfully!");
  };

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const featureList = [
    {
      key: "enableAnalytics" as keyof typeof features,
      name: "Analytics Dashboard",
      description: "Enable advanced analytics for merchants",
      enabled: features.enableAnalytics
    },
    {
      key: "enableCustomDomains" as keyof typeof features,
      name: "Custom Domains",
      description: "Allow merchants to use custom domains",
      enabled: features.enableCustomDomains
    },
    {
      key: "enableMultiLanguage" as keyof typeof features,
      name: "Multi-language Support",
      description: "Enable Arabic/English language switching",
      enabled: features.enableMultiLanguage
    },
    {
      key: "enableAdvancedBilling" as keyof typeof features,
      name: "Advanced Billing",
      description: "Enable subscription management and billing",
      enabled: features.enableAdvancedBilling
    },
    {
      key: "enableWhiteLabel" as keyof typeof features,
      name: "White Label",
      description: "Allow merchants to remove platform branding",
      enabled: features.enableWhiteLabel
    },
    {
      key: "enableAPIAccess" as keyof typeof features,
      name: "API Access",
      description: "Enable API access for enterprise customers",
      enabled: features.enableAPIAccess
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h3>
      
      <div className="space-y-4">
        {featureList.map((feature) => (
          <div key={feature.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{feature.name}</h4>
              <p className="text-xs text-gray-500">{feature.description}</p>
            </div>
            <button
              onClick={() => toggleFeature(feature.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                feature.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  feature.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
        
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Update Feature Flags
        </button>
      </div>
    </div>
  );
}


