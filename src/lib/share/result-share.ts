import { config } from "@/lib/config";
import { appPath } from "@/lib/routes";

function preferHttpsForPublicUrl(url: URL) {
  const isLocalHost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "0.0.0.0";

  if (url.protocol === "http:" && !isLocalHost) {
    url.protocol = "https:";
  }
}

export function buildResultSharePageUrl(
  kind: "photo" | "fortune" | "gaokao",
  taskId: string,
  token: string,
) {
  const url = new URL(
    appPath(`/share/${kind}/${taskId}`),
    config.NEXT_PUBLIC_APP_URL,
  );
  preferHttpsForPublicUrl(url);
  url.searchParams.set("s", token);
  return url.toString();
}

export function buildMiniProgramWebviewPath(h5Url: string) {
  const webviewPath = config.NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH;
  return `${webviewPath}?url=${encodeURIComponent(JSON.stringify(h5Url))}`;
}

export function buildResultShareTitle(kind: "photo" | "fortune") {
  if (kind === "photo") {
    return "我在大宜宾生成了一张 AI 写真";
  }
  return "我在大宜宾生成了一张 AI 报告图";
}

export function buildResultShareDescription(kind: "photo" | "fortune") {
  if (kind === "photo") {
    return "点击查看同款 AI 写真效果";
  }
  return "点击查看你的专属趣味报告";
}
