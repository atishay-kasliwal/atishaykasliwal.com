/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export - works with both GitHub Pages and Cloudflare Pages
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // Works with both GitHub Pages and Cloudflare Pages
  // Remove basePath and assetPrefix for Cloudflare Pages
  basePath: '',
  assetPrefix: '',
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(JPG|jpg|jpeg|png|gif|svg)$/i,
      type: 'asset/resource',
    });
    return config;
  },
}

module.exports = nextConfig

