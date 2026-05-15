import { config as loadEnv } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { portraitTemplateSpecs } from "@/features/templates/portrait-template-specs";

loadEnv({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "public", "templates");

const baseUrl = process.env.APIMART_BASE_URL ?? "https://api.apimart.ai";
const apiKey = process.env.APIMART_API_KEY;
const concurrency = Number(process.env.COVER_CONCURRENCY ?? 3);
const onlySlugs = new Set(
  (process.env.COVER_ONLY_SLUGS ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean),
);

const sharedCoverStyle = [
  "生成一张 3:4 竖版个人展示面模板例图。",
  "必须是一张完整的单张真实照片，不要四宫格，不要拼图，不要多分镜，不要海报排版。",
  "画面中只出现一位年轻成年中国人，不能像任何真实明星或公众人物。",
  "人物必须好看、有吸引力：男性帅气清爽、有少年感和时尚感；女性漂亮时髦、有高级感和辨识度。",
  "整体像专业摄影师拍摄的时尚写真、杂志街拍或高级棚拍，而不是 AI 生成图。",
  "皮肤保留真实毛孔、细微纹理和自然不对称；头发有真实发丝和碎发；服装有真实布料褶皱、织物纹理和材质反光。",
  "光线必须可信，阴影柔和自然，真实相机浅景深，色彩可以丰富但不过饱和。",
  "景别可以是近景、半身、七分身或全身，但人物占比要大，脸部清楚，姿态自然漂亮。",
  "画面无文字、无 logo、无水印、无 UI、无多余人物、无儿童、无宠物。",
  "避免塑料皮、蜡像脸、过度磨皮、网红假脸、廉价影楼风、假背景、CGI、插画、动漫、3D、未来机甲。",
].join("\n");

const negativePrompt = [
  "四宫格",
  "拼图",
  "多分镜",
  "collage",
  "grid",
  "AI感",
  "塑料皮",
  "蜡像脸",
  "过度磨皮",
  "假脸",
  "脸部变形",
  "五官崩坏",
  "手指畸形",
  "多余手指",
  "肢体扭曲",
  "廉价影楼风",
  "假背景",
  "CGI",
  "3D render",
  "anime",
  "cartoon",
  "illustration",
  "fantasy armor",
  "futuristic mech",
  "文字",
  "水印",
  "logo",
  "低清晰度",
  "模糊",
  "multiple people",
  "child",
  "pet",
].join(", ");

async function main() {
  if (!apiKey) {
    throw new Error("缺少 APIMART_API_KEY，请先在 .env.local 填好服务商 Key。");
  }

  await mkdir(outputDir, { recursive: true });
  const failures: string[] = [];

  const specs =
    onlySlugs.size > 0
      ? portraitTemplateSpecs.filter((spec) => onlySlugs.has(spec.slug))
      : portraitTemplateSpecs;

  if (onlySlugs.size > 0) {
    const foundSlugs = new Set(specs.map((spec) => spec.slug));
    const unknownSlugs = [...onlySlugs].filter((slug) => !foundSlugs.has(slug));

    if (unknownSlugs.length > 0) {
      throw new Error(`未找到这些模板：${unknownSlugs.join(", ")}`);
    }
  }

  await runPool(specs, concurrency, async (spec) => {
    const outputPath = join(outputDir, `${spec.slug}.png`);
    console.log(`Submitting ${spec.name} (${spec.gender})...`);

    try {
      const providerTaskId = await submitCover({
        prompt: buildCoverPrompt(spec),
      });
      console.log(`${spec.name}: task ${providerTaskId}`);
      const imageUrl = await waitForResult(providerTaskId, spec.name);
      await downloadImage(imageUrl, outputPath);
      console.log(`Saved ${outputPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${spec.slug}: ${message}`);
      console.error(`${spec.name} failed: ${message}`);
    }
  });

  if (failures.length > 0) {
    throw new Error(`以下模板生成失败：\n${failures.join("\n")}`);
  }
}

function buildCoverPrompt(spec: (typeof portraitTemplateSpecs)[number]) {
  const genderStyle =
    spec.gender === "male"
      ? [
          "人物性别：男。",
          "人物形象：22-30 岁年轻成年中国男性，帅气清爽，脸型利落，眉眼干净，下颌线清楚，身材比例修长；不要中年感，不要油腻。",
        ].join("\n")
      : [
          "人物性别：女。",
          "人物形象：20-28 岁年轻成年中国女性，漂亮时髦，五官精致但真实自然，气质高级，身材比例修长；不要网红假脸。",
        ].join("\n");

  const sceneStyle = [
    `模板名称：${spec.name}`,
    `模板分类：${spec.category}`,
    `模板气质：${spec.tagline}`,
    `模板说明：${spec.description}`,
    `具体场景：${spec.scenePrompt}`,
    `例图方向：${spec.coverPrompt}`,
  ].join("\n");

  const daiBoost = spec.slug.includes("dai")
    ? [
        "傣族服饰特别要求：服饰颜色可以更鲜艳、更上镜，但仍然保持真实摄影质感。",
        "可使用孔雀绿、宝石蓝、琥珀金、绛红、亮银饰等明亮色彩，织锦和银饰细节要精致清楚。",
        "整体是尊重文化的高级民族风时尚写真，不要廉价演出服，不要影楼假布景。",
      ].join("\n")
    : "";

  return [sharedCoverStyle, genderStyle, sceneStyle, daiBoost]
    .filter(Boolean)
    .join("\n\n");
}

async function submitCover(input: { prompt: string }) {
  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: input.prompt,
      negative_prompt: negativePrompt,
      size: "3:4",
      resolution: "1k",
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
  const timeoutMs = 15 * 60 * 1000;

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

async function downloadImage(imageUrl: string, outputPath: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`下载图片失败：${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function runPool<T>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(size, 1) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();

      if (item) {
        await worker(item);
      }
    }
  });

  await Promise.all(workers);
}

function getString(object: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function findFirstImageUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value.startsWith("http")) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = findFirstImageUrl(item);

      if (nestedUrl) {
        return nestedUrl;
      }
    }
  }

  if (value && typeof value === "object") {
    const itemRecord = value as Record<string, unknown>;
    const url = getString(itemRecord, [
      "url",
      "image_url",
      "result_url",
      "output_url",
      "public_url",
    ]);

    if (url) {
      return url;
    }

    for (const nestedValue of Object.values(itemRecord)) {
      const nestedUrl = findFirstImageUrl(nestedValue);

      if (nestedUrl) {
        return nestedUrl;
      }
    }
  }

  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
