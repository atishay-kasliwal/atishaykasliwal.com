/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export - works with both GitHub Pages and Cloudflare Pages
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // Works with both GitHub Pages and Cloudflare Pages
  basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES ? '/atishay-kasliwal.github.io' : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES ? '/atishay-kasliwal.github.io' : '',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(JPG|jpg|jpeg|png|gif|svg)$/i,
      type: 'asset/resource',
    });
    return config;
  },
}

module.exports = nextConfig

