import { readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseOpenTypeFont, type OpenTypeFont } from "opentype.js";
import sharp, { type OverlayOptions } from "sharp";

import { getPublicGaokaoReport } from "@/features/gaokao/gaokao-repository";
import { parseGaokaoReportContent } from "@/features/gaokao/gaokao-report";
import { verifyResultShareToken } from "@/lib/auth/result-share-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cardTemplatePath = path.join(
  process.cwd(),
  "public/static/gaokao/gaokao-share-card-template-20260628.png",
);
const logoPath = path.join(process.cwd(), "public/brand/dayibin-icon.png");
const cardFontPath = path.join(
  process.cwd(),
  "public/fonts/NotoSansCJKsc-Regular.otf",
);
let cachedCardFont: OpenTypeFont | null | undefined;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitLines(value: string, maxChars: number, maxLines: number) {
  const chars = Array.from(value);
  const lines: string[] = [];

  for (let index = 0; index < chars.length && lines.length < maxLines; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }

  return lines;
}

function getCardFont() {
  if (cachedCardFont !== undefined) {
    return cachedCardFont;
  }

  try {
    const buffer = readFileSync(cardFontPath);
    const fontBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    cachedCardFont = parseOpenTypeFont(fontBuffer);
  } catch {
    cachedCardFont = null;
  }

  return cachedCardFont;
}

function truncateText(value: string, maxChars: number) {
  const chars = Array.from(value.replace(/\s+/g, ""));

  if (chars.length <= maxChars) {
    return chars.join("");
  }

  return `${chars.slice(0, maxChars - 1).join("")}…`;
}

function formatCardNumber(value: number | null) {
  if (value === null) {
    return "未填";
  }

  return String(value);
}

function renderTextLines(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  maxChars: number;
  maxLines: number;
  lineHeight: number;
}) {
  return splitLines(input.value, input.maxChars, input.maxLines)
    .map(
      (line, index) =>
        renderCardText({
          value: line,
          x: input.x,
          y: input.y + index * input.lineHeight,
          fontSize: input.fontSize,
          fill: input.fill,
        }),
    )
    .join("");
}

function renderCardText(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  maxWidth?: number;
}) {
  const font = getCardFont();
  const { value, x, y, fontSize, fill, maxWidth } = input;

  if (!font) {
    return `<text x="${x}" y="${y}" font-family="Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif" font-size="${fontSize}" fill="${fill}">${escapeXml(value)}</text>`;
  }

  const advanceWidth = maxWidth ? font.getAdvanceWidth(value, fontSize) : 0;
  const nextFontSize =
    maxWidth && advanceWidth > maxWidth
      ? Math.max(24, Math.floor((fontSize * maxWidth) / advanceWidth))
      : fontSize;
  const pathData = font.getPath(value, x, y, nextFontSize).toPathData(2);

  return `<path d="${pathData}" fill="${fill}"/>`;
}

function renderPlainText(input: {
  value: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  weight?: number;
}) {
  return renderCardText(input);
}

function recommendationLine(
  items: Array<{
    schoolName: string;
    majorName: string | null;
    riskLabel: string;
    rankGap: number | null;
    majorSuggestions?: Array<{ majorName: string }>;
  }>,
) {
  const item = items[0];

  if (!item) {
    return {
      school: "暂无候选",
      major: "建议补充位次或放宽偏好后重新生成",
      suggestion: "建议补充位次后核对专业",
    };
  }

  const rankGap =
    item.rankGap === null
      ? "位次待核对"
      : item.rankGap > 0
        ? `靠后${item.rankGap}名`
        : item.rankGap < 0
          ? `靠前${Math.abs(item.rankGap)}名`
          : "位次接近";

  const suggestedMajor = item.majorSuggestions?.[0]?.majorName;

  return {
    school: truncateText(item.schoolName, 16),
    major: truncateText(item.majorName ?? "专业组信息待核对", 25),
    suggestion: truncateText(
      suggestedMajor
        ? `建议专业 ${suggestedMajor}  ${item.riskLabel} ${rankGap}`
        : `建议核对组内专业  ${item.riskLabel} ${rankGap}`,
      26,
    ),
  };
}

function buildCardSvg(report: Awaited<ReturnType<typeof getPublicGaokaoReport>>) {
  if (!report) {
    return "";
  }

  const content = parseGaokaoReportContent({
    summary: report.summary,
    profile: report.profile,
    recommendations: report.recommendations,
  });
  const student = content.studentSnapshot;
  const lines: Array<[
    string,
    string,
    string,
    number,
    ReturnType<typeof recommendationLine>,
  ]> = [
    ["冲一冲", "#367ce8", "#23365f", 522, recommendationLine(report.recommendations.chong)],
    ["稳一稳", "#20a992", "#1d5f55", 728, recommendationLine(report.recommendations.wen)],
    ["保一保", "#e38433", "#70411c", 935, recommendationLine(report.recommendations.bao)],
  ];
  const titleName = truncateText(student.name, 8);
  const scoreText =
    student.score === null
      ? renderCardText({
          value: "未填",
          x: 260,
          y: 305,
          fontSize: 40,
          fill: "#39577d",
          maxWidth: 120,
        })
      : `${renderPlainText({
          value: formatCardNumber(student.score),
          x: 260,
          y: 305,
          fontSize: 38,
          fill: "#39577d",
        })}${renderCardText({
          value: "分",
          x: 338,
          y: 305,
          fontSize: 40,
          fill: "#39577d",
          maxWidth: 40,
        })}`;
  const rankText =
    student.rank === null
      ? renderCardText({
          value: "未填",
          x: 538,
          y: 305,
          fontSize: 40,
          fill: "#39577d",
          maxWidth: 120,
        })
      : renderPlainText({
          value: formatCardNumber(student.rank),
          x: 538,
          y: 305,
          fontSize: 38,
          fill: "#39577d",
        });

  return `<svg width="900" height="1200" viewBox="0 0 900 1200" xmlns="http://www.w3.org/2000/svg">
  ${renderCardText({
    value: "大宜宾志愿填报 AI 助手",
    x: 90,
    y: 120,
    fontSize: 40,
    fill: "#2e5f9e",
    maxWidth: 520,
  })}
  ${renderCardText({
    value: `${titleName}的志愿初筛报告`,
    x: 90,
    y: 220,
    fontSize: 68,
    fill: "#1f355f",
    maxWidth: 680,
  })}
  ${renderCardText({
    value: student.subjectType,
    x: 96,
    y: 305,
    fontSize: 40,
    fill: "#39577d",
    maxWidth: 150,
  })}
  ${scoreText}
  ${renderCardText({
    value: "位次",
    x: 440,
    y: 305,
    fontSize: 40,
    fill: "#39577d",
    maxWidth: 100,
  })}
  ${rankText}
  ${renderTextLines({
    value: content.headline,
    x: 96,
    y: 376,
    fontSize: 32,
    fill: "#5d708c",
    maxChars: 24,
    maxLines: 2,
    lineHeight: 44,
  })}
  ${lines
    .map(
      ([label, labelColor, textColor, y, value]) => `
  <g>
      ${renderCardText({
      value: label,
      x: 105,
      y,
      fontSize: 38,
      fill: labelColor,
      maxWidth: 140,
    })}
    ${renderCardText({
      value: value.school,
      x: 275,
      y: y + 14,
      fontSize: 40,
      fill: textColor,
      maxWidth: 500,
    })}
    ${renderCardText({
      value: value.major,
      x: 275,
      y: y + 64,
      fontSize: 31,
      fill: textColor,
      maxWidth: 510,
    })}
    ${renderCardText({
      value: value.suggestion,
      x: 275,
      y: y + 104,
      fontSize: 28,
      fill: textColor,
      maxWidth: 510,
    })}
  </g>`,
    )
    .join("")}
  ${renderCardText({
    value: "结果仅供参考，正式填报以官方、省考试院和高校章程为准",
    x: 104,
    y: 1108,
    fontSize: 23,
    fill: "#826f43",
    maxWidth: 710,
  })}
  ${renderCardText({
    value: "完整报告请打开大宜宾 App 查看",
    x: 104,
    y: 1144,
    fontSize: 23,
    fill: "#826f43",
    maxWidth: 555,
  })}
  ${renderCardText({
    value: "大宜宾",
    x: 710,
    y: 1144,
    fontSize: 30,
    fill: "#826f43",
    maxWidth: 120,
  })}
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(_request.url);
  const token = url.searchParams.get("s");

  if (!token || !verifyResultShareToken(token, "gaokao", id)) {
    return new Response("Not found", { status: 404 });
  }

  const report = await getPublicGaokaoReport(id);

  if (!report) {
    return new Response("Not found", { status: 404 });
  }

  const composites: OverlayOptions[] = [
    { input: Buffer.from(buildCardSvg(report)) },
  ];

  try {
    composites.push({
      input: await sharp(logoPath).resize(82, 82).png().toBuffer(),
      left: 724,
      top: 62,
    });
  } catch {
    // Card generation still works if the logo asset is unavailable.
  }

  const image = await sharp(cardTemplatePath)
    .resize(900, 1200, { fit: "cover" })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  return new Response(new Uint8Array(image), {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "image/jpeg",
    },
  });
}
