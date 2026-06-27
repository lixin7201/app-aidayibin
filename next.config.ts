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
        source: "/photo",
        headers: noStoreHeaders(),
      },
      {
        source: "/fortune",
        headers: noStoreHeaders(),
      },
      {
        source: "/api/:path*",
        headers: noStoreHeaders(),
      },
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

function noStoreHeaders() {
  return [
    {
      key: "Cache-Control",
      value: "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
    {
      key: "Pragma",
      value: "no-cache",
    },
    {
      key: "Expires",
      value: "0",
    },
  ];
}

export default nextConfig;
