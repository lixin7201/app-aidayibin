import { config as loadEnv } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

loadEnv({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "outputs", "ai-thinking-card");
const providerArtPath = join(outputDir, "provider-handdrawn-paper.png");
const finalPath = join(outputDir, "ai-thinking-knowledge-card-4k.png");
const promptPath = join(outputDir, "provider-handdrawn-paper.prompt.txt");

const baseUrl = process.env.APIMART_BASE_URL ?? "https://api.apimart.ai";
const apiKey = process.env.APIMART_API_KEY;

const width = 3072;
const height = 4096;

async function main() {
  await mkdir(outputDir, { recursive: true });
  await maybeGenerateProviderArt();

  const svg = await buildCardSvg();
  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();
  const base = existsSync(providerArtPath)
    ? await sharp(providerArtPath)
        .resize(width, height, { fit: "cover" })
        .modulate({ saturation: 0.82, brightness: 1.05 })
        .png()
        .toBuffer()
    : await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: "#fffdf8",
        },
      })
        .png()
        .toBuffer();

  await sharp(base)
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fffdf8" opacity="0.56"/></svg>`,
        ),
        blend: "over",
      },
      { input: textLayer, blend: "over" },
    ])
    .png({ compressionLevel: 9 })
    .toFile(finalPath);

  console.log(`Saved ${finalPath}`);
}

async function maybeGenerateProviderArt() {
  if (existsSync(providerArtPath)) {
    console.log(`Using existing provider art ${providerArtPath}`);
    return;
  }

  if (!apiKey) {
    console.warn("APIMART_API_KEY is missing; continuing with local layout only.");
    return;
  }

  const prompt = [
    "Generate a clean vertical 3:4 study-note background in the style of a hand-drawn Xiaohongshu learning card.",
    "White graph paper, light gray square grid, subtle warm paper texture, colorful highlighter smudges, tiny doodles of a horse, folder, arrows, feedback loop, sticky notes, pens, and simple abstract diagrams.",
    "No readable text, no Chinese characters, no English words, no formulas, no watermark, no logo.",
    "Leave large blank writing areas, especially the center and left side. Soft pastel colors: pale peach, sky blue, lemon yellow, mint green, lavender, pink highlighter.",
    "It should feel like a neat student's handwritten math note page, but without any actual writing.",
  ].join("\n");

  await writeFile(promptPath, prompt, "utf8");

  const taskId = await submitProviderTask(prompt);
  console.log(`APIMart task ${taskId}`);
  const imageUrl = await waitForProviderImage(taskId);
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download provider art: ${response.status}`);
  }

  await writeFile(providerArtPath, Buffer.from(await response.arrayBuffer()));
  console.log(`Saved provider art ${providerArtPath}`);
}

async function submitProviderTask(prompt: string) {
  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      negative_prompt:
        "text, Chinese characters, English words, formulas, watermark, logo, messy layout, dark background, photorealistic people",
      size: "3:4",
      resolution: "2k",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider submit failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const data = Array.isArray(payload.data)
    ? ((payload.data[0] ?? {}) as Record<string, unknown>)
    : ((payload.data ?? {}) as Record<string, unknown>);
  const taskId = findString(payload, ["task_id", "id"]) ?? findString(data, ["task_id", "id"]);

  if (!taskId) {
    throw new Error(`Provider returned no task id: ${JSON.stringify(payload)}`);
  }

  return taskId;
}

async function waitForProviderImage(taskId: string) {
  const startedAt = Date.now();
  const timeoutMs = 20 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(6500);

    const response = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Provider poll failed: ${await response.text()}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const result = (data.result ?? {}) as Record<string, unknown>;
    const status = (
      findString(payload, ["status", "state"]) ??
      findString(data, ["status", "state"]) ??
      ""
    ).toLowerCase();
    const imageUrl =
      findString(data, ["image_url", "url", "result_url", "output_url"]) ??
      findFirstImageUrl(data.output) ??
      findFirstImageUrl(data.images) ??
      findFirstImageUrl(result.images) ??
      findFirstImageUrl(result.output);

    if (["success", "succeeded", "completed", "done"].includes(status) && imageUrl) {
      return imageUrl;
    }

    if (["failed", "failure", "error"].includes(status)) {
      throw new Error(`Provider generation failed: ${JSON.stringify(payload)}`);
    }

    console.log(`Provider still ${status || "processing"}...`);
  }

  throw new Error(`Provider generation timed out: ${taskId}`);
}

async function buildCardSvg() {
  const sections = [
    section1(),
    section2(),
    section3(),
    section4(),
    section5(),
    section6(),
    section7(),
    footer(),
  ].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="paperNoise" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.045"/>
      </feComponentTransfer>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#16304f" flood-opacity="0.10"/>
    </filter>
    <style>
      .body { font-family: "Hiragino Sans GB", "STHeiti", "PingFang SC", sans-serif; fill: #172452; }
      .title { font-family: "Songti SC", "Songti", "Hiragino Sans GB", serif; font-weight: 700; fill: #15145f; }
      .hand { font-family: "Marker Felt", "Chalkboard SE", "Hiragino Sans GB", sans-serif; fill: #15225a; }
      .small { font-size: 34px; }
      .note { font-size: 38px; }
      .bodyText { font-size: 42px; }
      .subText { font-size: 36px; }
      .line { stroke: #172452; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; fill: none; }
      .thin { stroke: #172452; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    </style>
  </defs>
  ${grid()}
  <rect width="${width}" height="${height}" fill="#fffdf7" opacity="0.35" filter="url(#paperNoise)"/>
  ${header()}
  ${sections}
</svg>`;
}

function grid() {
  const minor = [];
  for (let x = 0; x <= width; x += 64) {
    minor.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#d9dee6" stroke-width="${x % 320 === 0 ? 2.4 : 1.3}" opacity="${x % 320 === 0 ? 0.78 : 0.62}"/>`);
  }
  for (let y = 0; y <= height; y += 64) {
    minor.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#d9dee6" stroke-width="${y % 320 === 0 ? 2.4 : 1.3}" opacity="${y % 320 === 0 ? 0.78 : 0.62}"/>`);
  }
  return `<rect width="${width}" height="${height}" fill="#fffdf8"/>\n${minor.join("\n")}`;
}

function header() {
  return `
  <g transform="translate(0 0)">
    <rect x="808" y="56" width="1456" height="184" rx="34" fill="#f4dfd4" opacity="0.92" transform="rotate(-1.1 1536 148)" filter="url(#softShadow)"/>
    <text x="1536" y="174" text-anchor="middle" class="title" font-size="96">AI 思考能力：对话外脑</text>
    <text x="1536" y="292" text-anchor="middle" class="body" font-size="42">AI 是马，你是骑手；学的是挽具工程，不是背提示词模板</text>
    ${highlight(444, 324, 2184, 56, "#dff0ff", 0.7, -0.6)}
    <text x="1536" y="366" text-anchor="middle" class="hand" font-size="44">核心：给足事实 → 指准方向 → 让结果回传 → 敢放手让它在文件夹里跑</text>
  </g>`;
}

function section1() {
  return `
  <g transform="translate(128 438)">
    ${num(1, 0, 0, "#bfe5ff")}
    ${label("先换脑子：别迷信提示词", 102, 42, "#ffdff1")}
    ${bullet(130, 128, "上下文 > 提示词：长程任务不是一枪打完，而是一轮轮对齐。")}
    ${bullet(130, 202, "事实 > 逻辑：缺事实时，AI 会编出听起来很顺的废话。")}
    ${bullet(130, 276, "AI 不是神：它有力气、有脾气、会跑偏，需要你控马头。")}
    ${bullet(130, 350, "思考能力 = 把模糊问题想清楚，再让 AI 放大执行。")}
    ${miniHorse(2240, 50)}
  </g>`;
}

function section2() {
  return `
  <g transform="translate(128 930)">
    ${num(2, 0, 0, "#d8f7b2")}
    ${label("AI 三层能力：很多失败只是你只用了 L1", 102, 42, "#fff4a8")}
    ${capBox(120, 126, 830, 270, "L1 基础能力", ["语言、逻辑、常识", "代码、推理、改写", "像“会聊天的顾问”"], "#e6f3ff")}
    ${capBox(1086, 126, 830, 270, "L2 工具能力", ["搜索、读 PDF", "跑代码、读写文件", "让 AI 开始能做事"], "#e8ffe1")}
    ${capBox(2052, 126, 830, 270, "L3 协作能力", ["记住偏好和共识", "根据反馈修正下一步", "越做越贴近现实"], "#fff1dc")}
    ${arrow(955, 260, 1068, 260)}
    ${arrow(1920, 260, 2036, 260)}
  </g>`;
}

function section3() {
  return `
  <g transform="translate(128 1390)">
    ${num(3, 0, 0, "#ffd7e8")}
    ${label("挽具三股绳：把 AI 的方向稳住", 102, 42, "#e6dcff")}
    ${ropeBox(112, 142, "① 先给事实", ["原始转写 / PPT", "截图 / 评论 / 数据", "少概括，多原文"], "#dff3ff")}
    ${ropeBox(1064, 142, "② 把控方向", ["目标、边界、约束", "一窗一事，长聊开新窗", "为什么 / 如果 / 具体"], "#e8ffd8")}
    ${ropeBox(2016, 142, "③ 结果回传", ["把真实效果喂回来", "作业点评 / 测试数据", "让 AI 在现实里变准"], "#fff0d6")}
    ${arrow(858, 292, 1034, 292)}
    ${arrow(1810, 292, 1986, 292)}
    ${feedbackLoop(1410, 520)}
    <text x="1518" y="618" text-anchor="middle" class="hand" font-size="38" fill="#d44c95">不是 A→B 结束，而是走一步、回传一步、再走下一步</text>
  </g>`;
}

function section4() {
  return `
  <g transform="translate(128 2100)">
    ${num(4, 0, 0, "#c9f2ff")}
    ${label("文件夹工作法：让对话落地成知识库", 102, 42, "#fff6b7")}
    ${folderDiagram(112, 126)}
    ${layerStack(1510, 112)}
  </g>`;
}

function section5() {
  return `
  <g transform="translate(128 2740)">
    ${num(5, 0, 0, "#e9ddff")}
    ${label("挑马：没有全能模型，只有合适模型", 102, 42, "#e4ffd8")}
    ${modelChip(120, 126, "微信 / 公众号", "腾讯元宝", "#e2f3ff")}
    ${modelChip(754, 126, "结构化 / 长任务", "Claude", "#f1e5ff")}
    ${modelChip(1388, 126, "学术 / YouTube", "Gemini", "#e4ffd8")}
    ${modelChip(2022, 126, "短视频 / 语音", "豆包", "#fff0d6")}
    ${modelChip(430, 324, "群体行为理解", "GPT / Gemini", "#ffe5f0")}
    ${modelChip(1270, 324, "文件夹干活", "Codex / Claude Code", "#e2f3ff")}
    <text x="1518" y="590" text-anchor="middle" class="hand" font-size="38">重要问题要交叉验证：找“血统不同”的两匹马互相核对</text>
  </g>`;
}

function section6() {
  return `
  <g transform="translate(128 3360)">
    ${num(6, 0, 0, "#d8f7b2")}
    ${label("打开 AI 前 5 问", 102, 42, "#ffdff1")}
    ${check(150, 138, "我挑对马了吗？这次最看重哪层能力？")}
    ${check(150, 222, "背景、事实、原始资料给够了吗？")}
    ${check(150, 306, "我有在指挥它的注意力吗？")}
    ${check(150, 390, "真实结果有没有回喂给 AI？")}
    ${check(150, 474, "这事能不能搭好挽具，敢放手让它跑？")}
    ${doodleChecklist(2300, 120)}
  </g>`;
}

function section7() {
  return `
  <g transform="translate(128 3870)">
    ${highlight(0, -18, 2820, 114, "#fff4a8", 0.72, 0.3)}
    <text x="38" y="56" class="hand" font-size="44">本课最小行动：</text>
    <text x="410" y="56" class="body" font-size="40">课程总索引 + 第一课 MD + 原始资料路径 + 可复用模板 + 用后复盘更新</text>
  </g>`;
}

function footer() {
  return `
  <g transform="translate(0 4022)">
    <text x="1536" y="26" text-anchor="middle" class="body" font-size="28" opacity="0.58">生财 AI 大航海第一课 · AI 思考能力（对话外脑）｜知识库学习卡片</text>
  </g>`;
}

function num(value: number, x: number, y: number, color: string) {
  return `
    <text x="${x + 16}" y="${y + 82}" class="hand" font-size="132" fill="#17305b" opacity="0.25">${value}</text>
    <text x="${x}" y="${y + 76}" class="hand" font-size="132" fill="#17305b">${value}</text>
    <rect x="${x + 4}" y="${y + 10}" width="72" height="92" rx="16" fill="${color}" opacity="0.45"/>`;
}

function label(text: string, x: number, y: number, color: string) {
  return `
    ${highlight(x - 8, y - 50, Math.min(1760, text.length * 48), 70, color, 0.72, -0.7)}
    <text x="${x}" y="${y}" class="title" font-size="58">${escapeXml(text)}</text>`;
}

function bullet(x: number, y: number, text: string) {
  return `
    <path d="M${x - 48},${y - 18} q28,-26 54,0 q-24,24 -54,0z" fill="#ffdbe9" opacity="0.8"/>
    <text x="${x}" y="${y}" class="body bodyText">${escapeXml(text)}</text>`;
}

function capBox(x: number, y: number, w: number, h: number, title: string, lines: string[], fill: string) {
  return `
  <g transform="translate(${x} ${y})">
    <path d="M18 0 H${w - 24} Q${w + 6} 18 ${w - 2} 46 V${h - 26} Q${w - 8} ${h + 4} ${w - 42} ${h} H28 Q-8 ${h - 8} 0 ${h - 42} V34 Q2 4 18 0Z" fill="${fill}" opacity="0.78" stroke="#172452" stroke-width="5"/>
    <text x="40" y="70" class="hand" font-size="48">${escapeXml(title)}</text>
    ${lines.map((line, index) => `<text x="46" y="${136 + index * 56}" class="body subText">${escapeXml(line)}</text>`).join("")}
  </g>`;
}

function ropeBox(x: number, y: number, title: string, lines: string[], fill: string) {
  return `
  <g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="820" height="330" rx="32" fill="${fill}" opacity="0.80" stroke="#172452" stroke-width="5"/>
    <path d="M48 92 C230 50, 516 52, 756 90" class="thin" stroke="#d44c95"/>
    <text x="50" y="72" class="hand" font-size="52">${escapeXml(title)}</text>
    ${lines.map((line, index) => `<text x="64" y="${144 + index * 62}" class="body subText">· ${escapeXml(line)}</text>`).join("")}
  </g>`;
}

function modelChip(x: number, y: number, a: string, b: string, fill: string) {
  return `
  <g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="560" height="128" rx="28" fill="${fill}" opacity="0.86" stroke="#172452" stroke-width="4"/>
    <text x="38" y="48" class="body" font-size="34">${escapeXml(a)}</text>
    <text x="38" y="100" class="hand" font-size="45">${escapeXml(b)}</text>
  </g>`;
}

function check(x: number, y: number, text: string) {
  return `
  <g transform="translate(${x} ${y})">
    <rect x="-10" y="-45" width="2040" height="66" rx="18" fill="#ffffff" opacity="0.40"/>
    <path d="M0 -10 L22 16 L72 -42" stroke="#41a66b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="96" y="0" class="body bodyText">${escapeXml(text)}</text>
  </g>`;
}

function folderDiagram(x: number, y: number) {
  return `
  <g transform="translate(${x} ${y})">
    <path d="M0 70 H248 L302 18 H660 Q702 18 702 62 V350 Q702 398 654 398 H48 Q0 398 0 350Z" fill="#e8f4ff" opacity="0.88" stroke="#172452" stroke-width="6"/>
    <text x="46" y="112" class="hand" font-size="46">AI大航海学习/</text>
    ${folderLine(60, 178, "00-课程总索引.md")}
    ${folderLine(60, 236, "01-AI思考能力.md")}
    ${folderLine(60, 294, "素材-原始转写 / PPT")}
    ${folderLine(60, 352, "模板-提示词与 skill")}
    <path d="M760 116 C884 96, 1006 114, 1096 190 C1186 266, 1192 354, 1134 420" class="thin" stroke="#d44c95"/>
    <text x="802" y="474" class="hand" font-size="38">把智慧写回文件，不让它散在聊天框</text>
  </g>`;
}

function folderLine(x: number, y: number, text: string) {
  return `<text x="${x}" y="${y}" class="body subText">- ${escapeXml(text)}</text>`;
}

function layerStack(x: number, y: number) {
  const layers = [
    ["原始资料层", "转写 / PPT / 问答", "#fff0d6"],
    ["认知原则层", "上下文、事实、挽具", "#e8ffd8"],
    ["操作流程层", "事实→方向→回传", "#dff3ff"],
    ["调用模板层", "启动 / 纠偏 / 沉淀", "#ffe4f2"],
    ["复盘更新层", "用后反馈再写回", "#eee4ff"],
  ];

  return `
  <g transform="translate(${x} ${y})">
    ${layers
      .map(
        ([title, desc, fill], index) => `
        <g transform="translate(${index * 78} ${index * 70})">
          <rect x="0" y="0" width="900" height="112" rx="22" fill="${fill}" opacity="0.86" stroke="#172452" stroke-width="4"/>
          <text x="34" y="48" class="hand" font-size="42">${title}</text>
          <text x="326" y="48" class="body" font-size="34">${desc}</text>
        </g>`,
      )
      .join("")}
  </g>`;
}

function miniHorse(x: number, y: number) {
  return `
  <g transform="translate(${x} ${y}) rotate(3)">
    <path d="M70 170 C120 88, 258 72, 350 126 C406 160, 456 160, 524 134" class="line"/>
    <path d="M190 188 L128 310 M250 192 L244 318 M360 182 L420 310 M430 166 L506 286" class="line"/>
    <path d="M514 136 C594 82, 654 126, 622 196 C582 192, 560 172, 514 136Z" fill="#fff4a8" stroke="#172452" stroke-width="7"/>
    <path d="M616 130 L682 86 M624 148 L704 132" class="thin"/>
    <path d="M152 106 C108 56, 60 70, 44 132" class="thin"/>
    <text x="58" y="382" class="hand" font-size="38">AI 是马</text>
    <text x="360" y="382" class="hand" font-size="38">人控方向</text>
  </g>`;
}

function feedbackLoop(x: number, y: number) {
  return `
  <g transform="translate(${x} ${y})">
    <path d="M-170 0 C-138 -118, 36 -158, 132 -62" class="thin" stroke="#41a66b"/>
    <path d="M132 -62 l-18 -60 l62 16" fill="none" stroke="#41a66b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M160 4 C124 122, -60 150, -148 48" class="thin" stroke="#d44c95"/>
    <path d="M-148 48 l22 58 l-64 -12" fill="none" stroke="#d44c95" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function doodleChecklist(x: number, y: number) {
  return `
  <g transform="translate(${x} ${y}) rotate(-2)">
    <rect x="0" y="0" width="440" height="360" rx="26" fill="#fff7dc" stroke="#172452" stroke-width="6"/>
    <line x1="54" y1="92" x2="380" y2="92" class="thin"/>
    <line x1="54" y1="168" x2="380" y2="168" class="thin"/>
    <line x1="54" y1="244" x2="380" y2="244" class="thin"/>
    <path d="M54 78 L76 100 L126 44" stroke="#41a66b" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M54 154 L76 176 L126 120" stroke="#41a66b" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M54 230 L76 252 L126 196" stroke="#41a66b" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="64" y="324" class="hand" font-size="36">先开一场有质量的会</text>
  </g>`;
}

function highlight(x: number, y: number, w: number, h: number, fill: string, opacity: number, rotate: number) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotate} ${x + w / 2} ${y + h / 2})"/>`;
}

function arrow(x1: number, y1: number, x2: number, y2: number) {
  return `
  <path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1 - 38}, ${(x1 + x2) / 2} ${y2 + 38}, ${x2} ${y2}" class="thin"/>
  <path d="M${x2} ${y2} l-38 -18 l10 42 z" fill="#172452"/>`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findString(object: Record<string, unknown>, keys: string[]) {
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
      const url = findFirstImageUrl(item);

      if (url) {
        return url;
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const direct = findString(record, ["url", "image_url", "result_url", "output_url"]);

    if (direct) {
      return direct;
    }

    return (
      findFirstImageUrl(record.url) ??
      findFirstImageUrl(record.image_url) ??
      findFirstImageUrl(record.result_url) ??
      findFirstImageUrl(record.output_url) ??
      findFirstImageUrl(record.output) ??
      findFirstImageUrl(record.images) ??
      findFirstImageUrl(record.result)
    );
  }

  return undefined;
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
