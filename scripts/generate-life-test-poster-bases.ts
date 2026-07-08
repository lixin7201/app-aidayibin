import { config as loadEnv } from "dotenv";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { lifeTestResultList } from "../src/features/life-test/config/results";
import type { LifeTestResultType } from "../src/features/life-test/types";

loadEnv({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "public", "life-test", "posters");
const promptDocPath = join(
  projectRoot,
  "docs",
  "life-test-poster-base-prompts-2026-07-07.md",
);
const baseUrl = process.env.APIMART_BASE_URL ?? "https://api.apimart.ai";
const apiKey = process.env.APIMART_API_KEY;

const negativePrompt = [
  "文字",
  "字母",
  "数字",
  "logo",
  "水印",
  "二维码",
  "UI",
  "海报排版文字",
  "真人",
  "真实人物",
  "真人写真",
  "写实摄影",
  "摄影照片",
  "网红写真",
  "photorealistic",
  "realistic photo",
  "semi-realistic",
  "3D render",
  "CGI",
  "多人拥挤",
  "畸形手指",
  "多余手指",
  "肢体扭曲",
  "低清晰度",
  "模糊",
  "廉价影楼风",
  "赛博朋克",
  "未来机甲",
  "政治符号",
  "医疗场景",
].join(", ");

async function main() {
  if (!apiKey) {
    throw new Error("缺少 APIMART_API_KEY，请先在 .env.local 填好服务商 Key。");
  }

  await mkdir(outputDir, { recursive: true });

  const code = getArg("code");
  const force = hasFlag("force");
  const batch = hasFlag("batch");
  const limit = Number(getArg("limit") ?? "0") || undefined;
  const selected = selectResults(code).slice(0, limit);
  const targets: Array<{ result: LifeTestResultType; outputPath: string }> = [];

  for (const result of selected) {
    const outputPath = join(outputDir, `${result.code}.png`);

    if (!force && (await fileExists(outputPath))) {
      console.log(`Skip ${result.name}: ${outputPath} already exists.`);
      continue;
    }

    targets.push({ result, outputPath });
  }

  if (batch && targets.length > 1) {
    await generateBatch(targets);
  } else {
    for (const target of targets) {
      await generateOne(target);
    }
  }

  await writePromptDoc();
}

async function generateOne(target: {
  result: LifeTestResultType;
  outputPath: string;
}) {
  console.log(`Submitting ${target.result.name} (${target.result.code})...`);
  const taskId = await submitImage(buildPrompt(target.result));
  console.log(`${target.result.name}: task ${taskId}`);
  const imageUrl = await waitForResult(taskId, target.result.name);
  await downloadAndNormalizeImage(imageUrl, target.outputPath);
  console.log(`Saved ${target.outputPath}`);
}

async function generateBatch(
  targets: Array<{ result: LifeTestResultType; outputPath: string }>,
) {
  console.log(`Batch submitting ${targets.length} poster base tasks...`);
  const submitted = await Promise.allSettled(
    targets.map(async (target) => {
      const taskId = await submitImage(buildPrompt(target.result));
      console.log(`${target.result.name}: task ${taskId}`);

      return { ...target, taskId };
    }),
  );
  const jobs = submitted.flatMap((item) =>
    item.status === "fulfilled" ? [item.value] : [],
  );
  const submitFailures = submitted.flatMap((item, index) =>
    item.status === "rejected"
      ? [`${targets[index]?.result.name ?? "unknown"} 提交失败：${String(item.reason)}`]
      : [],
  );

  const completed = await Promise.allSettled(
    jobs.map(async (job) => {
      const imageUrl = await waitForResult(job.taskId, job.result.name);
      await downloadAndNormalizeImage(imageUrl, job.outputPath);
      console.log(`Saved ${job.outputPath}`);
    }),
  );
  const completionFailures = completed.flatMap((item, index) =>
    item.status === "rejected"
      ? [`${jobs[index]?.result.name ?? "unknown"} 下载失败：${String(item.reason)}`]
      : [],
  );
  const failures = [...submitFailures, ...completionFailures];

  if (failures.length) {
    throw new Error(`批量生成未全部完成：\n${failures.join("\n")}`);
  }
}

function selectResults(code?: string) {
  if (!code) {
    return lifeTestResultList;
  }

  const selected = lifeTestResultList.filter((result) => result.code === code);

  if (!selected.length) {
    throw new Error(`未知 life-test 结果 code：${code}`);
  }

  return selected;
}

function buildPrompt(result: LifeTestResultType) {
  return [
    "Create a high-quality vertical 3:4 mobile share poster base image for a viral personality-test result card. The image must contain absolutely no text, no letters, no numbers, no logo, no watermark, no QR code, and no UI.",
    "",
    `Persona result: ${result.name}.`,
    `Persona keywords: ${result.keywords.join(", ")}.`,
    `Mood sentence for visual direction only, do not render text: ${result.slogan}`,
    `Scene inspiration: Yibin, Sichuan local lifestyle, ${result.citySymbol}, riverside city warmth, bamboo and river city atmosphere where suitable.`,
    "",
    "Use one expressive cartoon avatar or symbolic character as the central visual. The character should feel like a humorous persona sticker or comic protagonist, not a real person, not a portrait photo, not an influencer shoot.",
    "Composition: create a designed result-card base with a strong visual mascot/character in the middle-right or middle area, and leave clean darker or calmer negative space in the top 24% and lower third so the program can overlay Chinese title and result text later. Do not put important faces or details in those text zones.",
    "Style: polished 2D Chinese comic illustration, graphic-novel result card, bold clean outlines, expressive face, flat shapes, cel shading, subtle risograph or screenprint grain, playful local meme energy, premium app campaign design, rich but clean colors, not cluttered.",
    "Strictly avoid photorealism, realistic skin texture, camera depth of field, portrait photography, 3D render, glossy CGI, fashion editorial posing, or anything that looks like a real human photo.",
  ].join("\n");
}

async function submitImage(prompt: string) {
  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      negative_prompt: negativePrompt,
      size: "3:4",
      resolution: "2k",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`提交失败：${await response.text()}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const firstDataItem = Array.isArray(payload.data)
    ? ((payload.data[0] ?? {}) as Record<string, unknown>)
    : ((payload.data ?? {}) as Record<string, unknown>);
  const taskId =
    getString(payload, ["task_id", "id"]) ??
    getString(firstDataItem, ["task_id", "id"]);

  if (!taskId) {
    throw new Error(`服务商未返回任务 ID：${JSON.stringify(payload)}`);
  }

  return taskId;
}

async function waitForResult(taskId: string, label: string) {
  const startedAt = Date.now();
  const timeoutMs = 20 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(6000);
    const response = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`查询失败：${await response.text()}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const status = (
      getString(payload, ["status", "state"]) ??
      getString(data, ["status", "state"]) ??
      ""
    ).toLowerCase();
    const result = (data.result ?? {}) as Record<string, unknown>;
    const imageUrl =
      getString(data, ["image_url", "url", "result_url", "output_url"]) ??
      findFirstImageUrl(data.output) ??
      findFirstImageUrl(data.images) ??
      findFirstImageUrl(result.images) ??
      findFirstImageUrl(result.output);

    if (["success", "succeeded", "completed", "done"].includes(status) && imageUrl) {
      return imageUrl;
    }

    if (["failed", "failure", "error"].includes(status)) {
      throw new Error(`${label} 生成失败：${JSON.stringify(payload)}`);
    }

    console.log(`${label}: still ${status || "processing"}...`);
  }

  throw new Error(`${label} 等待超时：${taskId}`);
}

async function downloadAndNormalizeImage(imageUrl: string, outputPath: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`下载图片失败：${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const normalized = await sharp(buffer, { failOn: "none" })
    .resize(1024, 1536, { fit: "cover" })
    .png()
    .toBuffer();

  await writeFile(outputPath, normalized);
}

async function writePromptDoc() {
  const content = [
    "# 宜宾精神状态测试漫画底图生成提示词",
    "",
    "这批图片只作为无文字漫画底图使用，分享接口会在服务端继续叠加昵称、结果名、短句和关键词。",
    "",
    "## 生成参数",
    "",
    "```json",
    JSON.stringify(
      {
        model: "gpt-image-2",
        size: "3:4",
        resolution: "2k",
        n: 1,
        output: "public/life-test/posters/{code}.png",
      },
      null,
      2,
    ),
    "```",
    "",
    "## 负向提示词",
    "",
    "```text",
    negativePrompt,
    "```",
    "",
    ...lifeTestResultList.flatMap((result, index) => [
      `## ${index + 1}. ${result.name}`,
      "",
      `文件：\`public/life-test/posters/${result.code}.png\``,
      "",
      "```text",
      buildPrompt(result),
      "```",
      "",
    ]),
  ].join("\n");

  await writeFile(promptDocPath, content);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

function getString(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function findFirstImageUrl(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return /^https?:\/\//.test(value) ? value : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstImageUrl(item);

      if (found) {
        return found;
      }
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = getString(record, [
      "url",
      "image_url",
      "result_url",
      "output_url",
    ]);

    if (direct) {
      return direct;
    }

    for (const child of Object.values(record)) {
      const found = findFirstImageUrl(child);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
