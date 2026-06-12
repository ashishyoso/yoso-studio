/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // puppeteer must not be bundled by webpack/server tracing — load it at runtime
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'pdf-parse'],
  },
};

export default nextConfig;
