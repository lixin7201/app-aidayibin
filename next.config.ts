import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ai";
const basePath =
  rawBasePath === "/" ? undefined : rawBasePath.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  basePath,
  async redirects() {
    return [
      {
        source: "/",
        destination: appBasePathOrRoot(),
        permanent: false,
        basePath: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/templates/thumbs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/templates/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "lixindemac-studio.local",
    "localhost",
    "127.0.0.1",
    "192.168.2.23",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

function appBasePathOrRoot() {
  return basePath ?? "/";
}

export default nextConfig;
