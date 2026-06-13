import type { NextConfig } from "next";

const isElectronBuild = process.env.ELECTRON_BUILD === '1';

const nextConfig: NextConfig = {
  // Enable static export for Electron builds
  output: isElectronBuild ? 'export' : undefined,

  // For static export, we need to disable image optimization
  images: {
    unoptimized: true,
  },

  // Ensure trailing slashes for file:// protocol compatibility
  trailingSlash: true,

  // Allow cross-origin requests from an additional dev origin (e.g. a Tailscale
  // node for remote dev). Comma-separated list via env var; empty in CI/default.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : [],

  // No assetPrefix needed - we use custom app:// protocol that handles absolute paths
};

export default nextConfig;
