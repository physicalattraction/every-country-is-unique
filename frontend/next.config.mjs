/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // Skip type checking during production build for better performance
  typescript: {
    // !! WARN !!
    // This will disable type checking during build!
    // Make sure your CI/CD pipeline runs type checking separately
    ignoreBuildErrors: true,
  },
  // Skip ESLint during production build for better performance
  eslint: {
    // Only run ESLint on local development
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 