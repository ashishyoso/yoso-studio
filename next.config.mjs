/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // puppeteer must not be bundled by webpack/server tracing — load it at runtime
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
};

export default nextConfig;
