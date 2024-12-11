// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ipfs-utils"],
  },
  reactStrictMode: true,
  // Ignoring typescript/eslint errors during build (deploy won't fail even if there are errors)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['your-domain.com'],
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.module.rules.push({
      test: /\.(glb|gltf|avif)$/,
      use: {
        loader: 'file-loader',
      },
    });
    return config;
  },
};

module.exports = nextConfig;
