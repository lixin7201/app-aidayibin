import type { NextRequest } from "next/server";

const paletteMap: Record<string, [string, string, string]> = {
  "yibin-night-cinematic": ["#121826", "#315b87", "#d99b5d"],
  "sanjiangkou-sunset": ["#f3b562", "#486b7d", "#f7f1e3"],
  "new-chinese-teahouse": ["#31473a", "#c8a36d", "#f4efe5"],
  "business-editorial": ["#f4f6f8", "#1d2939", "#8a9bad"],
  "retro-hongkong-film": ["#4b2c31", "#d09052", "#f0d0a0"],
  "modern-hanfu-garden": ["#3d5a40", "#b88d5a", "#f5ead7"],
  "republic-era-newspaper": ["#5b4636", "#c9b18c", "#f2eadc"],
  "forest-natural-light": ["#284734", "#87a96b", "#f4f1de"],
  "cafe-lifestyle": ["#6f4e37", "#d8b892", "#f6efe6"],
  "black-gold-magazine": ["#111111", "#b88746", "#f2e7d2"],
  "spring-flower-street": ["#ec9fb5", "#79a87d", "#fff3e8"],
  "minimal-white-studio": ["#f7f4ef", "#8d99ae", "#2b2d42"],
  "uploaded-reference": ["#dae2f8", "#d6a4a4", "#ffffff"],
};

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const [primary, secondary, accent] =
    paletteMap[slug] ?? paletteMap["minimal-white-studio"];
  const title = decodeURIComponent(slug)
    .split("-")
    .slice(0, 3)
    .join(" ");
  const svg = `
<svg width="960" height="1280" viewBox="0 0 960 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="960" y2="1280" gradientUnits="userSpaceOnUse">
      <stop stop-color="${primary}"/>
      <stop offset="0.52" stop-color="${secondary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
  </defs>
  <rect width="960" height="1280" fill="url(#bg)"/>
  <circle cx="220" cy="260" r="180" fill="${accent}" opacity="0.26" filter="url(#blur)"/>
  <circle cx="780" cy="930" r="260" fill="${primary}" opacity="0.22" filter="url(#blur)"/>
  <rect x="180" y="190" width="600" height="900" rx="300" fill="rgba(255,255,255,0.18)"/>
  <circle cx="480" cy="420" r="130" fill="rgba(255,255,255,0.58)"/>
  <path d="M282 910C324 714 408 628 480 628C552 628 636 714 678 910C618 964 552 990 480 990C408 990 342 964 282 910Z" fill="rgba(255,255,255,0.54)"/>
  <path d="M256 1118H704" stroke="rgba(255,255,255,0.62)" stroke-width="3"/>
  <text x="480" y="1168" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-size="42" font-family="Arial, Helvetica, sans-serif" letter-spacing="0">${title}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
}
