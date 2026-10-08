import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ai";
const basePath =
  rawBasePath === "/" ? undefined : rawBasePath.replace(/\/+$/, "");
const remoteImagePatterns = buildRemoteImagePatterns();

const nextConfig: NextConfig = {
  basePath,
  poweredByHeader: false,
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
        source: "/:path*",
        headers: securityHeaders(),
      },
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
    remotePatterns: remoteImagePatterns,
    maximumRedirects: 0,
    maximumResponseBody: 5 * 1024 * 1024,
    dangerouslyAllowLocalIP: false,
  },
};

function buildRemoteImagePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  for (const value of [
    process.env.ALIYUN_OSS_PUBLIC_BASE_URL ?? "https://img.dayibin.cn",
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL,
    process.env.LOCAL_IMAGE_PUBLIC_BASE_URL,
  ]) {
    if (!value) {
      continue;
    }

    const url = new URL(value);
    const basePath = url.pathname.replace(/\/$/, "");
    patterns.push({
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${basePath}/**`,
      search: "",
    });
  }

  return patterns;
}

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

function securityHeaders() {
  return [
    {
      key: "Content-Security-Policy",
      value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
    },
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(), geolocation=()",
    },
  ];
}

export default nextConfig;
