import { readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseOpenTypeFont, type OpenTypeFont } from "opentype.js";
import sharp from "sharp";

import { lifeTestCityConfig } from "@/features/life-test/config/city";
import { getLifeTestPosterBasePath } from "@/features/life-test/life-test-poster-assets";
import type {
  LifeTestResultType,
  LifeTestScoreResult,
} from "@/features/life-test/types";

const posterWidth = 1024;
const posterHeight = 1536;
const posterFontPath = path.join(
  process.cwd(),
  "public/fonts/NotoSansCJKsc-Regular.otf",
);
let cachedPosterFont: OpenTypeFont | null | undefined;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPosterFont() {
  if (cachedPosterFont !== undefined) {
    return cachedPosterFont;
  }

  try {
    const buffer = readFileSync(posterFontPath);
    const fontBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    cachedPosterFont = parseOpenTypeFont(fontBuffer);
  } catch {
    cachedPosterFont = null;
  }

  return cachedPosterFont;
}

function splitLines(value: string, maxChars: number, maxLines: number) {
  const chars = Array.from(value.replace(/\s+/g, ""));
  const lines: string[] = [];
  let index = 0;

  while (index < chars.length && lines.length < maxLines) {
    const end = Math.min(chars.length, index + maxChars);
    const lineChars = chars.slice(index, end);

    if (end < chars.length && "，。！？、；：".includes(chars[end] ?? "")) {
      lineChars.push(chars[end] ?? "");
      index = end + 1;
    } else {
      index = end;
    }

    lines.push(lineChars.join(""));
  }

  return lines;
}

function truncateText(value: string, maxChars: number) {
  const chars = Array.from(value.replace(/\s+/g, ""));

  if (chars.length <= maxChars) {
    return chars.join("");
  }

  return `${chars.slice(0, maxChars - 1).join("")}…`;
}

function renderPosterText(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  maxWidth?: number;
  anchor?: "start" | "middle";
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const font = getPosterFont();
  const {
    value,
    x,
    y,
    fontSize,
    fill,
    maxWidth,
    anchor = "start",
    opacity,
    stroke,
    strokeWidth = 1,
  } = input;
  const opacityAttribute =
    opacity === undefined ? "" : ` opacity="${opacity.toFixed(2)}"`;
  const strokeAttribute = stroke
    ? ` stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round" paint-order="stroke fill"`
    : "";

  if (!font) {
    const anchorAttribute =
      anchor === "middle" ? ' text-anchor="middle"' : "";

    return `<text x="${x}" y="${y}"${anchorAttribute}${opacityAttribute} font-family="Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif" font-size="${fontSize}" font-weight="900" fill="${fill}"${strokeAttribute}>${escapeXml(value)}</text>`;
  }

  const advanceWidth = font.getAdvanceWidth(value, fontSize);
  const nextFontSize =
    maxWidth && advanceWidth > maxWidth
      ? Math.max(22, Math.floor((fontSize * maxWidth) / advanceWidth))
      : fontSize;
  const nextAdvanceWidth = font.getAdvanceWidth(value, nextFontSize);
  const nextX = anchor === "middle" ? x - nextAdvanceWidth / 2 : x;
  const pathData = font.getPath(value, nextX, y, nextFontSize).toPathData(2);

  return `<path d="${pathData}" fill="${fill}"${opacityAttribute}${strokeAttribute}/>`;
}

function renderPosterArtText(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  maxWidth?: number;
  anchor?: "start" | "middle";
  accent?: string;
}) {
  const accent = input.accent ?? "#F7C66A";

  return [
    renderPosterText({
      ...input,
      x: input.x + 7,
      y: input.y + 9,
      fill: "#021917",
      opacity: 0.68,
      stroke: undefined,
    }),
    renderPosterText({
      ...input,
      x: input.x - 4,
      y: input.y - 4,
      fill: accent,
      opacity: 0.3,
      stroke: undefined,
    }),
    renderPosterText(input),
  ].join("");
}

function renderPosterLines(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  maxChars: number;
  maxLines: number;
  lineHeight: number;
  opacity?: number;
}) {
  return splitLines(input.value, input.maxChars, input.maxLines)
    .map((line, index) =>
      renderPosterText({
        value: line,
        x: input.x,
        y: input.y + index * input.lineHeight,
        fontSize: input.fontSize,
        fill: input.fill,
        opacity: input.opacity,
      }),
    )
    .join("");
}

function axisSummary(score?: LifeTestScoreResult | null) {
  if (!score) {
    return "宜宾精神状态报告";
  }

  if (score.hiddenTag) {
    return "隐藏款 / 不接受定义";
  }

  const career = score.axes.career === "growth" ? "机会派" : "安稳派";
  const pace = score.axes.pace === "fast" ? "冲刺派" : "松弛派";

  return `${career} / ${pace}`;
}

function renderPosterKeywordStickers(keywords: string[]) {
  const fills = ["#FFF7E6", "#F7C66A", "#D9F2E9", "#FFD2C4"];
  const rotations = [-5, 3, -3, 4];

  return keywords
    .map((keyword, index) => {
      const x = 100 + index * 166;
      const y = 1280;
      const width = 146;
      const height = 50;
      const centerX = x + width / 2;
      const centerY = y - height / 2;

      return `<g transform="rotate(${rotations[index % rotations.length]} ${centerX} ${centerY})">
        <rect x="${x + 5}" y="${y - 37}" width="${width}" height="${height}" rx="13" fill="#021917" opacity="0.34"/>
        <rect x="${x}" y="${y - 42}" width="${width}" height="${height}" rx="13" fill="${fills[index % fills.length]}" opacity="0.94"/>
        <rect x="${x}" y="${y - 42}" width="${width}" height="${height}" rx="13" stroke="#062F2B" stroke-opacity="0.48" stroke-width="2"/>
        ${renderPosterText({
          value: keyword,
          x: centerX,
          y: y - 10,
          fontSize: 22,
          fill: "#062F2B",
          maxWidth: 112,
          anchor: "middle",
        })}
      </g>`;
    })
    .join("");
}

async function renderPosterAvatarImage(input: {
  avatarUrl?: string | null;
  nickname: string;
}) {
  const size = 132;
  const innerSize = 118;
  const offset = Math.floor((size - innerSize) / 2);
  const initial = truncateText(input.nickname, 1) || "大";
  let avatarSource: Buffer | null = null;

  if (input.avatarUrl && /^https?:\/\//.test(input.avatarUrl)) {
    try {
      const response = await fetch(input.avatarUrl);

      if (response.ok) {
        avatarSource = Buffer.from(await response.arrayBuffer());
      }
    } catch {
      avatarSource = null;
    }
  }

  const avatarBuffer = avatarSource
    ? await sharp(avatarSource, { failOn: "none" })
        .resize(innerSize, innerSize, { fit: "cover" })
        .png()
        .toBuffer()
    : Buffer.from(`<svg width="${innerSize}" height="${innerSize}" viewBox="0 0 ${innerSize} ${innerSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${innerSize}" height="${innerSize}" fill="#FFF7E6"/>
      <text x="${innerSize / 2}" y="${innerSize / 2 + 18}" text-anchor="middle" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="58" font-weight="900" fill="#0B3D39">${escapeXml(initial)}</text>
    </svg>`);
  const mask = Buffer.from(`<svg width="${innerSize}" height="${innerSize}" viewBox="0 0 ${innerSize} ${innerSize}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="#fff"/>
  </svg>`);
  const clippedAvatar = await sharp(avatarBuffer, { failOn: "none" })
    .resize(innerSize, innerSize, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const shell = Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2 + 5}" cy="${size / 2 + 7}" r="${size / 2 - 7}" fill="#021917" opacity="0.48"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="#FFF7E6"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 5}" fill="none" stroke="#F7C66A" stroke-width="5"/>
  </svg>`);

  return sharp(shell, { failOn: "none" })
    .composite([{ input: clippedAvatar, left: offset, top: offset }])
    .png()
    .toBuffer();
}

export function renderLifeTestPosterFallbackBaseSvg(result: LifeTestResultType) {
  const growthColor = result.code.startsWith("growth") ? "#176B87" : "#0B4B3F";
  const openColor = result.code.includes("-open-") ? "#F7A23B" : "#9CD8C8";
  const fastColor = result.code.includes("-fast-") ? "#FF6B3D" : "#6CC0A6";

  return `<svg width="${posterWidth}" height="${posterHeight}" viewBox="0 0 ${posterWidth} ${posterHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="baseBg" x1="91" y1="0" x2="942" y2="1510" gradientUnits="userSpaceOnUse">
      <stop stop-color="${growthColor}"/>
      <stop offset="0.55" stop-color="#123E44"/>
      <stop offset="1" stop-color="${openColor}"/>
    </linearGradient>
    <radialGradient id="sun" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(760 318) rotate(90) scale(300)">
      <stop stop-color="#FFE7A8" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/>
    </radialGradient>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
  </defs>
  <rect width="${posterWidth}" height="${posterHeight}" fill="url(#baseBg)"/>
  <circle cx="760" cy="318" r="300" fill="url(#sun)"/>
  <circle cx="184" cy="1020" r="310" fill="${fastColor}" opacity="0.26" filter="url(#softBlur)"/>
  <path d="M0 700C132 646 252 678 394 612C566 532 724 594 872 648C942 674 988 674 1024 656V1536H0V700Z" fill="#082F2B" opacity="0.28"/>
  <path d="M0 804C164 748 320 788 486 726C648 666 776 724 916 748C970 758 1002 752 1024 744V1536H0V804Z" fill="#F5B64D" opacity="0.22"/>
  <path d="M248 1116C310 950 444 850 548 716C640 596 662 478 756 400C816 460 842 558 820 648C792 768 672 828 626 940C588 1034 632 1134 706 1248C558 1260 390 1230 248 1116Z" fill="#F8F0D8" opacity="0.16"/>
  <path d="M0 1232C152 1190 308 1226 462 1172C646 1108 792 1140 1024 1092V1536H0V1232Z" fill="#021917" opacity="0.34"/>
</svg>`;
}

export function renderLifeTestPosterOverlaySvg(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
  result: LifeTestResultType;
  score?: LifeTestScoreResult | null;
  pageUrl?: string;
}) {
  const nickname = input.nickname?.trim() || "大宜宾朋友";
  const reportOwnerText = `${truncateText(nickname, 8)} 的质检报告`;
  const slogan = truncateText(input.result.slogan, 34);
  const keywords = input.result.keywords.slice(0, 4);
  const footerText = input.pageUrl
    ? "长按保存，发给朋友涮坛子"
    : "打开大宜宾 App，测精神状态";

  return `<svg width="${posterWidth}" height="${posterHeight}" viewBox="0 0 ${posterWidth} ${posterHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topShade" x1="512" y1="0" x2="512" y2="520" gradientUnits="userSpaceOnUse">
      <stop stop-color="#031D1A" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#031D1A" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomShade" x1="512" y1="780" x2="512" y2="1536" gradientUnits="userSpaceOnUse">
      <stop stop-color="#031D1A" stop-opacity="0"/>
      <stop offset="0.42" stop-color="#031D1A" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#031D1A" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="posterPanel" x1="116" y1="918" x2="912" y2="1390" gradientUnits="userSpaceOnUse">
      <stop stop-color="#073B36" stop-opacity="0.86"/>
      <stop offset="0.6" stop-color="#042927" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#021917" stop-opacity="0.88"/>
    </linearGradient>
  </defs>
  <rect width="${posterWidth}" height="500" fill="url(#topShade)"/>
  <rect y="760" width="${posterWidth}" height="776" fill="url(#bottomShade)"/>
  <rect x="668" y="70" width="268" height="212" rx="30" fill="#021917" opacity="0.26"/>
  <circle cx="824" cy="140" r="72" fill="#FFF7E6" opacity="0.22"/>
  ${renderPosterText({
    value: reportOwnerText,
    x: 824,
    y: 250,
    fontSize: 21,
    fill: "#D9F2E9",
    maxWidth: 244,
    anchor: "middle",
    opacity: 0.96,
  })}
  <path d="M68 75H348C372 75 386 88 386 106C386 124 372 137 348 137H68C48 137 36 124 36 106C36 88 48 75 68 75Z" fill="#FFF7E6" opacity="0.94"/>
  ${renderPosterText({
    value: `${lifeTestCityConfig.appName} AI`,
    x: 72,
    y: 116,
    fontSize: 24,
    fill: "#0B3D39",
    maxWidth: 286,
  })}
  ${renderPosterArtText({
    value: "宜宾精神状态报告",
    x: 68,
    y: 216,
    fontSize: 64,
    fill: "#FFF7E6",
    stroke: "#062F2B",
    strokeWidth: 6,
    maxWidth: 760,
    accent: "#F7C66A",
  })}
  <path d="M74 244C210 226 346 229 478 242C420 264 226 270 78 258" fill="#F7C66A" opacity="0.78"/>
  ${renderPosterText({
    value: "系统鉴定已生成",
    x: 72,
    y: 294,
    fontSize: 28,
    fill: "#D9F2E9",
    maxWidth: 620,
    opacity: 0.94,
  })}
  <rect x="58" y="910" width="908" height="492" rx="32" fill="#021917" opacity="0.28"/>
  <rect x="62" y="902" width="900" height="492" rx="32" fill="url(#posterPanel)"/>
  <rect x="62" y="902" width="900" height="492" rx="32" stroke="#FFF7E6" stroke-opacity="0.28" stroke-width="2"/>
  <path d="M90 940H306L330 966L306 992H90Z" fill="#F7C66A" opacity="0.96"/>
  ${renderPosterText({
    value: "系统鉴定",
    x: 124,
    y: 976,
    fontSize: 24,
    fill: "#062F2B",
    maxWidth: 156,
  })}
  ${renderPosterText({
    value: input.result.citySymbol,
    x: 358,
    y: 976,
    fontSize: 25,
    fill: "#F7C66A",
    maxWidth: 500,
  })}
  ${renderPosterArtText({
    value: input.result.name,
    x: 100,
    y: 1098,
    fontSize: 80,
    fill: "#FFF7E6",
    stroke: "#062F2B",
    strokeWidth: 8,
    maxWidth: 810,
    accent: "#FF785A",
  })}
  <path d="M96 1138C242 1119 700 1122 892 1139C912 1142 920 1158 906 1176C880 1208 864 1234 876 1260C676 1244 322 1248 102 1264C118 1222 114 1180 96 1138Z" fill="#FFF7E6" opacity="0.14"/>
  <path d="M110 1145C252 1132 680 1134 872 1146" stroke="#F7C66A" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round"/>
  ${renderPosterLines({
    value: slogan,
    x: 126,
    y: 1190,
    fontSize: 31,
    fill: "#FFF7E6",
    maxChars: 17,
    maxLines: 2,
    lineHeight: 46,
    opacity: 0.96,
  })}
  ${renderPosterKeywordStickers(keywords)}
  <path d="M104 1332H520C542 1332 556 1344 556 1360C556 1376 542 1388 520 1388H104C82 1388 68 1376 68 1360C68 1344 82 1332 104 1332Z" fill="#FFF7E6" opacity="0.12"/>
  ${renderPosterText({
    value: axisSummary(input.score),
    x: 104,
    y: 1368,
    fontSize: 24,
    fill: "#F7C66A",
    maxWidth: 420,
  })}
  <g transform="rotate(-3 802 1334)">
  <rect x="682" y="1292" width="240" height="90" rx="28" fill="#FFF7E6" opacity="0.96"/>
  <rect x="696" y="1306" width="212" height="62" rx="20" stroke="#FF785A" stroke-opacity="0.78" stroke-width="3" stroke-dasharray="10 8"/>
  ${renderPosterText({
    value: "搜大宜宾",
    x: 802,
    y: 1332,
    fontSize: 25,
    fill: "#0B3D39",
    maxWidth: 160,
    anchor: "middle",
  })}
  ${renderPosterText({
    value: "测精神状态",
    x: 802,
    y: 1362,
    fontSize: 19,
    fill: "#0B3D39",
    maxWidth: 160,
    anchor: "middle",
  })}
  </g>
  ${renderPosterText({
    value: footerText,
    x: 512,
    y: 1472,
    fontSize: 21,
    fill: "#FFF7E6",
    maxWidth: 820,
    anchor: "middle",
    opacity: 0.86,
  })}
</svg>`;
}

export function renderLifeTestPosterSvg(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
  result: LifeTestResultType;
  score?: LifeTestScoreResult | null;
  pageUrl?: string;
}) {
  return renderLifeTestPosterOverlaySvg(input);
}

export async function renderLifeTestPosterJpeg(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
  result: LifeTestResultType;
  score?: LifeTestScoreResult | null;
  pageUrl?: string;
}) {
  const nickname = input.nickname?.trim() || "大宜宾朋友";
  const baseImagePath = await getLifeTestPosterBasePath(input.result.code);
  const baseImage = baseImagePath
    ? sharp(baseImagePath, { failOn: "none" })
    : sharp(Buffer.from(renderLifeTestPosterFallbackBaseSvg(input.result)), {
        failOn: "none",
      });
  const overlay = Buffer.from(renderLifeTestPosterOverlaySvg(input));
  const avatar = await renderPosterAvatarImage({
    avatarUrl: input.avatarUrl,
    nickname,
  });
  const image = await baseImage
    .resize(posterWidth, posterHeight, { fit: "cover" })
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: avatar, left: 758, top: 74 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return image;
}
