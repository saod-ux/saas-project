"use client";

import { useEffect, useState } from 'react';

interface ServerEnvResponse {
  ok: boolean;
  timestamp: string;
  nodeEnv: string;
  vercelEnv: string;
  serverEnvs: {
    env: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
  };
}

export default function DebugEnvPage() {
  const [serverData, setServerData] = useState<ServerEnvResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side environment variables (only NEXT_PUBLIC_* are available)
  const clientEnvs = {
    env: "client",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 6)}•••` 
      : "MISSING",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}` 
      : "MISSING",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}` 
      : "MISSING",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}` 
      : "MISSING",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}` 
      : "MISSING",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID 
      ? `SET:${process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 10)}•••` 
      : "MISSING",
  };

  // Environment validation utility
  const validateEnvs = () => {
    const validation = {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    console.log("[EnvProbe] client", validation);
    return validation;
  };

  useEffect(() => {
    // Validate client environments on mount
    validateEnvs();

    // Fetch server environment data
    const fetchServerData = async () => {
      try {
        const response = await fetch('/api/test-env');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setServerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Environment Variables Debug
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Client-side Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Client-Side Environment Variables
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              These are available in the browser (NEXT_PUBLIC_* only)
            </p>
            <div className="space-y-3">
              {Object.entries(clientEnvs).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm text-gray-700">{key}</span>
                  <span className={`font-mono text-sm px-2 py-1 rounded ${
                    value.startsWith('SET:') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Server-side Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Server-Side Environment Variables
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              These are available on the server (FIREBASE_* only)
            </p>
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading server data...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-semibold">Error:</p>
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {serverData && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <span className="text-sm text-blue-800">
                    Environment: {serverData.serverEnvs.env} | 
                    Node: {serverData.nodeEnv} | 
                    Vercel: {serverData.vercelEnv}
                  </span>
                </div>
                {Object.entries(serverData.serverEnvs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-mono text-sm text-gray-700">{key}</span>
                    <span className={`font-mono text-sm px-2 py-1 rounded ${
                      value.startsWith('SET:') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Client Environment Status:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(clientEnvs).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      value.startsWith('SET:') ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {key}: {value.startsWith('SET:') ? 'Available' : 'Missing'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Server Environment Status:</h3>
              {serverData ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  {Object.entries(serverData.serverEnvs).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        value.startsWith('SET:') ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {key}: {value.startsWith('SET:') ? 'Available' : 'Missing'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}