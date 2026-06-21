/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // puppeteer must not be bundled by webpack/server tracing — load it at runtime
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'pdf-parse'],
    // The API routes read client knowledge (.md bibles) + brand assets from disk
    // at runtime. Vercel's output file tracing only traces imports, so include
    // these files explicitly or the functions crash on deploy.
    outputFileTracingIncludes: {
      '/api/plan': ['./src/lib/clients/**/*.md', './public/clients/**'],
      '/api/strategy': ['./src/lib/clients/**/*.md'],
      '/api/render': ['./src/lib/clients/**/*.md', './public/clients/**'],
      '/api/full-render': ['./public/clients/**'],
    },
  },
};

export default nextConfig;
