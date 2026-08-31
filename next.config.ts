/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    // Ignores TypeScript errors during production builds on Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignores ESLint errors during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
