/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clean config without deprecated options
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules
    if (isServer) {
      config.externals = [...(config.externals || []), 'firebase-admin'];
    }
    
    // Handle node: scheme and Node.js built-ins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      path: false,
      process: false,
    };

    // Handle node: scheme specifically
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:process': 'process',
    };

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
}

module.exports = nextConfig
