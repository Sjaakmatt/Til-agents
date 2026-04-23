/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  transpilePackages: [
    "@insiders-lab/shared",
    "@insiders-lab/mcp-trades",
    "@insiders-lab/mcp-content-memory",
  ],
};

export default nextConfig;
