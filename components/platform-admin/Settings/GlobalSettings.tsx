"use client";

import { useState } from "react";

export default function GlobalSettings() {
  const [settings, setSettings] = useState({
    platformName: "SaaS Platform",
    defaultCurrency: "USD",
    maxProductsPerMerchant: 1000,
    maxDomainsPerMerchant: 5,
    maintenanceMode: false,
    allowNewRegistrations: true
  });

  const handleSave = () => {
    // In a real app, this would save to your database
    console.log("Saving settings:", settings);
    alert("Settings saved successfully!");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Global Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform Name
          </label>
          <input
            type="text"
            value={settings.platformName}
            onChange={(e) => setSettings({...settings, platformName: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Currency
          </label>
          <select
            value={settings.defaultCurrency}
            onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="KWD">KWD - Kuwaiti Dinar</option>
            <option value="SAR">SAR - Saudi Riyal</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Products per Merchant
          </label>
          <input
            type="number"
            value={settings.maxProductsPerMerchant}
            onChange={(e) => setSettings({...settings, maxProductsPerMerchant: parseInt(e.target.value)})}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Domains per Merchant
          </label>
          <input
            type="number"
            value={settings.maxDomainsPerMerchant}
            onChange={(e) => setSettings({...settings, maxDomainsPerMerchant: parseInt(e.target.value)})}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Maintenance Mode
            </label>
            <p className="text-xs text-gray-500">Disable platform for maintenance</p>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Allow New Registrations
            </label>
            <p className="text-xs text-gray-500">Let new merchants sign up</p>
          </div>
          <input
            type="checkbox"
            checked={settings.allowNewRegistrations}
            onChange={(e) => setSettings({...settings, allowNewRegistrations: e.target.checked})}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}


