type Qfh5Callback = (
  state: number | string,
  data?: {
    error?: string;
    type?: string;
    received?: number;
    total?: number;
    progress?: number;
    localPath?: string;
  },
) => void;

type MiniProgramSharePayload = {
  appId: string;
  gh_id: string;
  userName: string;
  path: string;
  webpageUrl: string;
  title: string;
  description: string;
  imageUrl: string;
};

type Qfh5NativeBridge = {
  jumpNewWebview?: (url: string) => void;
  outOpen?: (url: string) => void;
  openShare?: (platform?: number) => void;
  openShareDialog?: () => void;
  toast?: (type: number, content: string, duration: number) => void;
  viewImages?: (index: number, images: string[]) => void;
  saveImage?: (url: string, callback?: Qfh5Callback) => void;
  saveImageToAlbum?: (url: string, callback?: Qfh5Callback) => void;
  saveImageToPhotosAlbum?: (url: string, callback?: Qfh5Callback) => void;
  downloadImage?: (url: string, callback?: Qfh5Callback) => void;
  setShareInfo?: (
    title: string,
    image: string,
    description: string,
    url: string,
    callback?: Qfh5Callback,
    shareType?: number,
    shareAppLink?: string,
    wxMiniProgram?: string,
  ) => void;
  shareMiniProgram?: (input: {
    title: string;
    description: string;
    imageUrl: string;
    appId: string;
    userName: string;
    path: string;
    webpageUrl: string;
    callback?: Qfh5Callback;
  }) => void;
};

export type MiniProgramShareInput = {
  appId: string;
  originalId?: string;
  path: string;
  fallbackUrl: string;
  imageUrl: string;
};

type WindowWithQfh5 = Window & {
  QFH5?: Qfh5NativeBridge;
};

function getQfh5() {
  return (window as WindowWithQfh5).QFH5;
}

function isQfh5Success(state: number | string) {
  return String(state) === "1";
}

export function toAbsoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString();
}

function toCanonicalPageUrl(url: string) {
  const resolved = new URL(url, window.location.origin);
  resolved.search = "";
  resolved.hash = "";
  return resolved.toString();
}

export function withPublicImageAccess(url: string) {
  const publicUrl = new URL(url, window.location.origin);
  publicUrl.searchParams.set("public", "1");
  return publicUrl.toString();
}

export function withPreviewImageAccess(url: string) {
  const previewUrl = new URL(url, window.location.origin);
  previewUrl.searchParams.set("preview", "1");
  return previewUrl.toString();
}

export function withShareImageAccess(url: string) {
  const shareUrl = new URL(url, window.location.origin);
  shareUrl.searchParams.set("variant", "share");
  return shareUrl.toString();
}


function fetchImageAsBase64(url: string, onProgress?: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      } else {
        reject(new Error("Failed to fetch image"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
}

function isLegacyBase64SaveEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_BASE64_IMAGE_SAVE === "true";
}

function isWechatBrowser() {
  return /MicroMessenger/i.test(window.navigator?.userAgent ?? "");
}

function getDayibinAppDownloadUrl() {
  return (
    process.env.NEXT_PUBLIC_DAYIBIN_APP_DOWNLOAD_URL ??
    "https://a.app.qq.com/o/simple.jsp?pkgname=com.dayibin.forum"
  );
}

export function openImageUrl(url: string) {
  const qfh5 = getQfh5();

  if (qfh5?.jumpNewWebview) {
    qfh5.jumpNewWebview(url);
    return;
  }

  if (qfh5?.outOpen) {
    qfh5.outOpen(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export type SaveImageState =
  | { stage: "preparing"; message: string }
  | { stage: "saving"; message: string; progress?: number }
  | { stage: "slow"; message: string }
  | { stage: "success"; message: string }
  | { stage: "failed"; message: string; error?: string }
  | { stage: "fallback"; message: string }
  | { stage: "appRequired"; message: string; appUrl: string };

export type SaveImageResult = {
  success: boolean;
  localPath?: string;
  error?: string;
};

export function saveImageToPhone(input: {
  url: string;
  previewUrl?: string;
  originalUrl?: string;
  onStateChange?: (state: SaveImageState) => void;
}): Promise<SaveImageResult> {
  return new Promise((resolve) => {
    const qfh5 = getQfh5();
    const onStateChange = input.onStateChange ?? (() => {});
    const targetUrl = toAbsoluteUrl(input.originalUrl ?? input.url);

    if (!qfh5 && isWechatBrowser()) {
      onStateChange({
        stage: "appRequired",
        message: "微信内暂不提供原图保存。请下载或打开大宜宾 App，在 App 内保存高清原图。",
        appUrl: getDayibinAppDownloadUrl(),
      });
      resolve({
        success: false,
        error: "app_required",
      });
      return;
    }

    const existing = document.getElementById("aidayibin-save-image-overlay");
    if (existing) {
      existing.remove();
    }

    const previousOverflow = document.body.style.overflow;
    const overlay = document.createElement("div");
    overlay.id = "aidayibin-save-image-overlay";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "background:var(--background, #fff)",
      "color:var(--foreground, #000)",
      "touch-action:auto",
      "padding:24px 16px",
      "overflow:auto"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "大宜宾 AI 能力平台";
    title.style.cssText = "font-size:18px;font-weight:900;letter-spacing:0.1em;margin-top:16px;margin-bottom:24px;flex-shrink:0;";

    const subtitle = document.createElement("div");
    subtitle.textContent = "图片预览";
    subtitle.style.cssText = "font-size:15px;font-weight:bold;margin-bottom:16px;flex-shrink:0;";

    const imageWrap = document.createElement("div");
    imageWrap.style.cssText = [
      "position:relative",
      "width:min(100%, 400px)",
      "flex:1",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "border-radius:24px",
      "border:2px solid var(--border, #eee)",
      "margin-bottom:24px",
      "overflow:hidden",
      "min-height:300px"
    ].join(";");

    const image = document.createElement("img");
    image.src = input.previewUrl ?? targetUrl;
    image.style.cssText = [
      "display:block",
      "width:100%",
      "height:100%",
      "object-fit:cover",
      "-webkit-user-select:auto",
      "user-select:auto",
      "-webkit-touch-callout:default",
      "touch-action:auto",
      "pointer-events:auto",
    ].join(";");

    const loadingOverlay = document.createElement("div");
    loadingOverlay.style.cssText = [
      "position:absolute",
      "inset:0",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "background:rgba(255,255,255,0.8)",
      "color:#333",
      "font-size:16px",
      "font-weight:bold",
      "gap:8px"
    ].join(";");
    
    loadingOverlay.innerHTML = `
      <svg style="width:24px;height:24px;animation:spin 1s linear infinite" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <span>高清图片正在加载中</span>
      <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
    `;

    imageWrap.append(image, loadingOverlay);

    const saveButton = document.createElement("button");
    saveButton.textContent = "保存";
    saveButton.style.cssText = [
      "height:52px",
      "width:min(100%, 280px)",
      "border:2px solid var(--foreground, #000)",
      "border-radius:26px",
      "background:transparent",
      "color:var(--foreground, #000)",
      "font-size:16px",
      "font-weight:900",
      "margin-bottom:12px",
      "flex-shrink:0"
    ].join(";");

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "取消";
    cancelButton.style.cssText = [
      "height:40px",
      "width:min(100%, 280px)",
      "border:0",
      "background:transparent",
      "color:var(--muted, #666)",
      "font-size:14px",
      "font-weight:bold",
      "margin-bottom:12px",
      "flex-shrink:0"
    ].join(";");

    let isClosed = false;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let isResolved = false;

    function resolveOnce(result: SaveImageResult) {
      if (isResolved) return;
      isResolved = true;
      if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
      }
      resolve(result);
    }

    function close() {
      if (isClosed) return;
      isClosed = true;
      document.body.style.overflow = previousOverflow;
      overlay.remove();
      resolveOnce({ success: false, error: "canceled" });
    }

    cancelButton.addEventListener("click", close);

    const hdImage = new Image();
    hdImage.onload = () => {
      image.src = targetUrl;
      loadingOverlay.innerHTML = `<span style="background:rgba(0,0,0,0.6);color:#fff;padding:6px 12px;border-radius:8px;font-size:14px;">高清图片已加载</span>`;
      loadingOverlay.style.background = "transparent";
      setTimeout(() => {
        if (!isClosed) loadingOverlay.remove();
      }, 2000);
    };
    hdImage.src = targetUrl;

    saveButton.addEventListener("click", () => {
      onStateChange({ stage: "preparing", message: "正在准备图片，请稍候" });
      saveButton.disabled = true;
      saveButton.style.opacity = "0.5";

      saveTimeout = setTimeout(() => {
        if (isClosed) return;
        onStateChange({ stage: "fallback", message: "保存仍在进行，可能受网络影响，请长按图片保存" });
        saveButton.disabled = false;
        saveButton.style.opacity = "1";
        resolveOnce({ success: false, error: "timeout" });
      }, 30000);

      const nativeSave = qfh5?.saveImageToAlbum?.bind(qfh5) ?? qfh5?.saveImageToPhotosAlbum?.bind(qfh5) ?? qfh5?.saveImage?.bind(qfh5) ?? qfh5?.downloadImage?.bind(qfh5);

      async function executeSave() {
        try {
          if (nativeSave) {
             onStateChange({ stage: "saving", message: "正在调用相册保存" });
             nativeSave(targetUrl, (state, data) => {
               if (String(state) === "2" && data) {
                 onStateChange({ stage: "saving", message: "正在保存到相册", progress: data.progress });
                 return;
               }
               if (isQfh5Success(state)) {
                 onStateChange({ stage: "success", message: "已保存到相册" });
                 setTimeout(close, 1200);
                 resolveOnce({ success: true, localPath: data?.localPath });
                 return;
               }
               onStateChange({ stage: "failed", message: data?.error ?? "保存失败，请长按图片保存", error: data?.error });
               saveButton.disabled = false;
               saveButton.style.opacity = "1";
               resolveOnce({ success: false, error: data?.error ?? "保存失败" });
             });
             return;
          }

          if (qfh5?.viewImages) {
            qfh5.viewImages(0, [targetUrl]);
            onStateChange({ stage: "success", message: "已打开高清图，请长按图片保存" });
            setTimeout(close, 1200);
            resolveOnce({ success: true });
            return;
          }

          let downloadUrl = targetUrl;
          if (isLegacyBase64SaveEnabled()) {
            onStateChange({ stage: "preparing", message: "正在准备图片数据..." });
            downloadUrl = await fetchImageAsBase64(targetUrl, (percent) => {
              onStateChange({ stage: "preparing", message: `正在下载 ${percent}%` });
            });
          }

          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = "aidayibin-photo.png";
          a.target = "_blank";
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          onStateChange({ stage: "success", message: "已尝试调用浏览器下载" });
          setTimeout(close, 1200);
          resolveOnce({ success: true });
        } catch (err) {
          onStateChange({ stage: "fallback", message: "未能直接保存，请长按图片保存" });
          saveButton.disabled = false;
          saveButton.style.opacity = "1";
          resolveOnce({ success: false, error: err instanceof Error ? err.message : "保存失败" });
        }
      }
      
      void executeSave();
    });

    overlay.append(title, subtitle, imageWrap, saveButton, cancelButton);
    document.body.style.overflow = "hidden";
    document.body.append(overlay);
  });
}

export async function shareImage(input: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl?: string;
  miniProgram?: MiniProgramShareInput;
}) {
  const shareUrl = input.pageUrl
    ? toAbsoluteUrl(input.pageUrl)
    : toCanonicalPageUrl(window.location.href);
  const imageUrl = toAbsoluteUrl(input.imageUrl);
  const qfh5 = getQfh5();

  async function tryPlainShare() {
    if (qfh5?.setShareInfo) {
      const callback: Qfh5Callback = (state, data) => {
        if (state === 1) {
          qfh5.toast?.(1, "分享成功", 1);
          return;
        }

        qfh5.toast?.(2, data?.error ?? "分享失败，请稍后再试", 2);
      };

      qfh5.toast?.(3, "正在打开微信分享", 2);
      qfh5.setShareInfo(input.title, imageUrl, input.description, shareUrl, callback);

      if (qfh5.openShareDialog) {
        qfh5.openShareDialog();
        return;
      }

      if (qfh5.openShare) {
        qfh5.openShare(2);
        return;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: input.title,
          text: input.description,
          url: shareUrl,
        });
      } catch {
        // 用户取消分享时保持安静。
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // 浏览器兜底失败时不再抛出，避免打断页面操作。
    }
  }

  if (!input.miniProgram) {
    await tryPlainShare();
    return;
  }

  const miniProgram = input.miniProgram;
  const miniProgramPayload: MiniProgramSharePayload = {
    appId: miniProgram.appId,
    gh_id: miniProgram.originalId ?? "",
    userName: miniProgram.originalId ?? "",
    path: miniProgram.path,
    webpageUrl: toAbsoluteUrl(miniProgram.fallbackUrl),
    title: input.title,
    description: input.description,
    imageUrl: toAbsoluteUrl(miniProgram.imageUrl),
  };

  if (qfh5?.shareMiniProgram) {
    qfh5.toast?.(3, "正在打开微信分享", 2);
    qfh5.shareMiniProgram({
      title: input.title,
      description: input.description,
      imageUrl: toAbsoluteUrl(miniProgram.imageUrl),
      appId: miniProgram.appId,
      userName: miniProgram.originalId ?? "",
      path: miniProgram.path,
      webpageUrl: toAbsoluteUrl(miniProgram.fallbackUrl),
      callback: (state) => {
        if (state === 1) {
          qfh5.toast?.(1, "分享成功", 1);
          return;
        }

        qfh5.toast?.(2, "分享失败，已为你切换普通链接分享", 2);
        void tryPlainShare();
      },
    });
    return;
  }

  if (qfh5?.setShareInfo) {
    const callback: Qfh5Callback = (state) => {
      if (state === 1) {
        qfh5.toast?.(1, "分享成功", 1);
        return;
      }

      qfh5.toast?.(2, "分享失败，已为你切换普通链接分享", 2);
      void tryPlainShare();
    };

    qfh5.toast?.(3, "正在打开微信分享", 2);
    qfh5.setShareInfo(
      input.title,
      toAbsoluteUrl(miniProgram.imageUrl),
      input.description,
      toAbsoluteUrl(miniProgram.fallbackUrl),
      callback,
      2,
      toAbsoluteUrl(miniProgram.fallbackUrl),
      JSON.stringify(miniProgramPayload),
    );

    if (qfh5.openShareDialog) {
      qfh5.openShareDialog();
      return;
    }

    if (qfh5.openShare) {
      qfh5.openShare(2);
      return;
    }
  } else {
    await tryPlainShare();
  }
}
