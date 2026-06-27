import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  openImageUrl,
  saveImageToPhone,
  shareImage,
  toAbsoluteUrl,
  withPreviewImageAccess,
  withPublicImageAccess,
  withShareImageAccess,
} from "@/lib/qfh5-actions";

type MockCallback = (
  state: number | string,
  data?: { error?: string; localPath?: string },
) => void;

type MockElement = {
  tagName: string;
  style: CSSStyleDeclaration;
  textContent: string;
  innerHTML: string;
  src: string;
  alt: string;
  disabled: boolean;
  href?: string;
  download?: string;
  setAttribute: (name: string, value: string) => void;
  append: (...nodes: unknown[]) => void;
  appendChild: (node: unknown) => unknown;
  removeChild: (node: unknown) => unknown;
  addEventListener: (
    eventName: string,
    listener: (event: unknown) => void,
  ) => void;
  remove: () => void;
  click: () => void;
};

describe("qfh5 actions", () => {
  let createdElements: MockElement[];

  beforeEach(() => {
    createdElements = [];
    const mockWindow = {
      location: {
        href: "https://example.com/ai/photo",
        origin: "https://example.com",
      },
      navigator: {
        userAgent: "Mozilla/5.0",
      },
      open: vi.fn(),
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: number) => clearTimeout(id),
    };

    const MockImageClass = class MockImage {
      src = "";
      onload?: () => void;
    };

    // @ts-expect-error mock window for node test environment
    globalThis.window = { ...mockWindow, Image: MockImageClass };
    // @ts-expect-error mock Image constructor globally
    globalThis.Image = MockImageClass;

    globalThis.document = {
      getElementById: vi.fn(),
      createElement: vi.fn((tagName: string) => {
        const listeners = new Map<string, Array<(event: unknown) => void>>();
        const element: MockElement = {
          tagName,
          setAttribute: vi.fn(),
          append: vi.fn(),
          appendChild: vi.fn(),
          removeChild: vi.fn(),
          addEventListener: vi.fn((eventName: string, listener: (event: unknown) => void) => {
            listeners.set(eventName, [...(listeners.get(eventName) ?? []), listener]);
          }),
          remove: vi.fn(),
          style: {} as unknown as CSSStyleDeclaration,
          textContent: "",
          innerHTML: "",
          src: "",
          alt: "",
          disabled: false,
          click: vi.fn(() => {
            for (const listener of listeners.get("click") ?? []) {
              listener({ target: element, currentTarget: element });
            }
          }),
        };
        createdElements.push(element);
        return element;
      }) as unknown as Document["createElement"],
      body: {
        style: {} as unknown as CSSStyleDeclaration,
        append: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as unknown as HTMLElement,
    } as unknown as Document;
  });

  it("toAbsoluteUrl resolves relative url", () => {
    expect(toAbsoluteUrl("/foo")).toBe("https://example.com/foo");
  });

  it("withPublicImageAccess adds public=1", () => {
    expect(withPublicImageAccess("/api/image")).toBe(
      "https://example.com/api/image?public=1",
    );
  });

  it("withPreviewImageAccess adds preview=1", () => {
    expect(withPreviewImageAccess("/api/image")).toBe(
      "https://example.com/api/image?preview=1",
    );
  });

  it("withShareImageAccess adds variant=share", () => {
    expect(withShareImageAccess("/api/image")).toBe(
      "https://example.com/api/image?variant=share",
    );
  });

  it("openImageUrl falls back to window.open", () => {
    openImageUrl("https://example.com/image.jpg");
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("saveImageToPhone uses a direct URL browser download when no native bridge exists", async () => {
    const resultPromise = saveImageToPhone({
      url: "https://example.com/image.jpg",
      previewUrl: "https://example.com/preview.jpg",
    });
    createdElements.find((element) => element.tagName === "button")?.click();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    const anchor = createdElements.find((element) => element.tagName === "a");
    expect(anchor?.href).toBe("https://example.com/image.jpg");
  });

  it("saveImageToPhone asks WeChat users to open the app for original image saving", async () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 MicroMessenger/8.0.48",
    });

    const states: unknown[] = [];
    const result = await saveImageToPhone({
      url: "https://example.com/image.jpg",
      onStateChange: (state) => states.push(state),
    });

    expect(result).toEqual({
      success: false,
      error: "app_required",
    });
    expect(states).toContainEqual({
      stage: "appRequired",
      message: "微信内暂不提供原图保存。请下载或打开大宜宾 App，在 App 内保存高清原图。",
      appUrl: "https://a.app.qq.com/o/simple.jsp?pkgname=com.dayibin.forum",
    });
    expect(document.createElement).not.toHaveBeenCalled();
  });

  it("saveImageToPhone resolves success on native callback state 1", async () => {
    const mockSave = vi.fn((_url: string, callback?: MockCallback) => {
      callback?.(1, { localPath: "/album/image.jpg" });
    });

    globalThis.window.QFH5 = {
      saveImageToAlbum: mockSave,
    } as unknown as typeof globalThis.window.QFH5;

    const states: unknown[] = [];
    const resultPromise = saveImageToPhone({
      url: "https://example.com/image.jpg",
      onStateChange: (state) => states.push(state),
    });
    createdElements.find((element) => element.tagName === "button")?.click();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.localPath).toBe("/album/image.jpg");
    expect(mockSave).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      expect.any(Function),
    );
    expect(states.some((s) => (s as { stage: string }).stage === "preparing")).toBe(true);
    expect(states.some((s) => (s as { stage: string }).stage === "success")).toBe(true);
  });

  it("saveImageToPhone resolves failed on native callback state 0", async () => {
    const mockSave = vi.fn((_url: string, callback?: MockCallback) => {
      callback?.(0, { error: "权限被拒绝" });
    });

    globalThis.window.QFH5 = {
      saveImageToAlbum: mockSave,
    } as unknown as typeof globalThis.window.QFH5;

    const states: unknown[] = [];
    const resultPromise = saveImageToPhone({
      url: "https://example.com/image.jpg",
      onStateChange: (state) => states.push(state),
    });
    createdElements.find((element) => element.tagName === "button")?.click();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe("权限被拒绝");
    expect(states.some((s) => (s as { stage: string }).stage === "failed")).toBe(true);
  });

  it("shareImage calls setShareInfo with 5 args for plain share", async () => {
    const mockSetShareInfo = vi.fn();
    const mockOpenShareDialog = vi.fn();

    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
      openShareDialog: mockOpenShareDialog,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test Title",
      description: "Test Description",
      imageUrl: "https://example.com/image.jpg",
      pageUrl: "https://example.com/page",
    });

    expect(mockSetShareInfo).toHaveBeenCalledTimes(1);
    const args = mockSetShareInfo.mock.calls[0];
    expect(args[0]).toBe("Test Title");
    expect(args[1]).toBe("https://example.com/image.jpg");
    expect(args[2]).toBe("Test Description");
    expect(args[3]).toBe("https://example.com/page");
    expect(typeof args[4]).toBe("function");
    expect(args.length).toBe(5);
    expect(mockOpenShareDialog).toHaveBeenCalledTimes(1);
  });

  it("shareImage preserves the current http origin for legacy App sharing", async () => {
    Object.defineProperty(globalThis.window, "location", {
      configurable: true,
      value: {
        href: "http://ces.dayibin.cn/ai/photo",
        origin: "http://ces.dayibin.cn",
      },
    });
    const mockSetShareInfo = vi.fn();

    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test",
      description: "Desc",
      imageUrl: "http://ces.dayibin.cn/ai/api/generations/123/image?variant=card",
      pageUrl: "http://ces.dayibin.cn/ai/share/photo/123?s=token_abc",
    });

    const args = mockSetShareInfo.mock.calls[0];
    expect(args[1]).toBe("http://ces.dayibin.cn/ai/api/generations/123/image?variant=card");
    expect(args[3]).toBe("http://ces.dayibin.cn/ai/share/photo/123?s=token_abc");
  });

  it("shareImage calls setShareInfo with 8 args when miniProgram is configured", async () => {
    const mockSetShareInfo = vi.fn();
    const mockOpenShareDialog = vi.fn();

    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
      openShareDialog: mockOpenShareDialog,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test Title",
      description: "Test Description",
      imageUrl: "https://example.com/image.jpg",
      pageUrl: "https://example.com/page",
      miniProgram: {
        appId: "wx1234567890",
        originalId: "gh_abc123",
        path: "/subPack/information/webviewMini?url=%22https%3A%2F%2Fexample.com%2Fpage%22",
        fallbackUrl: "https://example.com/page",
        imageUrl: "https://example.com/card.jpg",
      },
    });

    expect(mockSetShareInfo).toHaveBeenCalledTimes(1);
    const args = mockSetShareInfo.mock.calls[0];
    expect(args.length).toBe(8);
    expect(args[0]).toBe("Test Title");
    expect(args[1]).toBe("https://example.com/card.jpg");
    expect(args[2]).toBe("Test Description");
    expect(args[3]).toBe("https://example.com/page");
    expect(typeof args[4]).toBe("function");
    expect(args[5]).toBe(2);
    expect(args[6]).toBe("https://example.com/page");

    const payload = JSON.parse(args[7] as string);
    expect(payload.appId).toBe("wx1234567890");
    expect(payload.gh_id).toBe("gh_abc123");
    expect(payload.userName).toBe("gh_abc123");
    expect(payload.path).toContain("webviewMini");
    expect(payload.webpageUrl).toBe("https://example.com/page");
    expect(payload.imageUrl).toBe("https://example.com/card.jpg");
    expect(mockOpenShareDialog).toHaveBeenCalledTimes(1);
  });

  it("shareImage falls back to plain share once on native failure", async () => {
    const mockToast = vi.fn();
    let callCount = 0;

    globalThis.window.QFH5 = {
      setShareInfo: (_title: string, _image: string, _desc: string, _url: string, callback?: MockCallback) => {
        callCount++;
        if (callback) {
          callback(0, { error: "分享失败" });
        }
      },
      toast: mockToast,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test Title",
      description: "Test Description",
      imageUrl: "https://example.com/image.jpg",
      pageUrl: "https://example.com/page",
      miniProgram: {
        appId: "wx1234567890",
        originalId: "gh_abc123",
        path: "/subPack/information/webviewMini?url=...",
        fallbackUrl: "https://example.com/page",
        imageUrl: "https://example.com/card.jpg",
      },
    });

    // 第一次是 miniProgram 分享（失败），第二次是 plain share
    expect(callCount).toBe(2);
    expect(mockToast).toHaveBeenCalledWith(
      2,
      "分享失败，已为你切换普通链接分享",
      expect.any(Number),
    );
  });

  it("shareImage keeps miniProgram 8 args when original id is missing", async () => {
    const mockSetShareInfo = vi.fn();

    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test Title",
      description: "Test Description",
      imageUrl: "https://example.com/image.jpg",
      pageUrl: "https://example.com/page",
      miniProgram: {
        appId: "wx1234567890",
        path: "/subPack/information/webviewMini?url=...",
        fallbackUrl: "https://example.com/page",
        imageUrl: "https://example.com/card.jpg",
      },
    });

    expect(mockSetShareInfo).toHaveBeenCalledTimes(1);
    const args = mockSetShareInfo.mock.calls[0];
    expect(args.length).toBe(8);
    expect(args[1]).toBe("https://example.com/card.jpg");
    expect(args[3]).toBe("https://example.com/page");
    expect(args[5]).toBe(2);
    expect(args[6]).toBe("https://example.com/page");
    const payload = JSON.parse(args[7] as string);
    expect(payload.gh_id).toBe("");
    expect(payload.userName).toBe("");
  });

  it("shareImage keeps complete query string including ?s=token in pageUrl", async () => {
    const mockSetShareInfo = vi.fn();
    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test",
      description: "Desc",
      imageUrl: "https://example.com/img.jpg",
      pageUrl: "https://example.com/ai/share/photo/123?s=token_abc",
    });

    expect(mockSetShareInfo).toHaveBeenCalledTimes(1);
    const args = mockSetShareInfo.mock.calls[0];
    expect(args[3]).toBe("https://example.com/ai/share/photo/123?s=token_abc");
  });

  it("shareImage converts relative miniProgram urls to absolute", async () => {
    const mockSetShareInfo = vi.fn();
    globalThis.window.QFH5 = {
      setShareInfo: mockSetShareInfo,
    } as unknown as typeof globalThis.window.QFH5;

    await shareImage({
      title: "Test Title",
      description: "Test Description",
      imageUrl: "https://example.com/image.jpg",
      pageUrl: "https://example.com/page",
      miniProgram: {
        appId: "wx123",
        originalId: "gh_abc",
        path: "/subPack/information/webviewMini?url=...",
        fallbackUrl: "/ai/share/photo/123",
        imageUrl: "/api/generations/123/image?variant=card",
      },
    });

    expect(mockSetShareInfo).toHaveBeenCalledTimes(1);
    const args = mockSetShareInfo.mock.calls[0];
    const payload = JSON.parse(args[7] as string);
    expect(payload.webpageUrl).toBe("https://example.com/ai/share/photo/123");
    expect(payload.imageUrl).toBe("https://example.com/api/generations/123/image?variant=card");
    expect(args[1]).toBe("https://example.com/api/generations/123/image?variant=card"); // The 2nd arg image
    expect(args[3]).toBe("https://example.com/ai/share/photo/123"); // The 4th arg url
    expect(args[6]).toBe("https://example.com/ai/share/photo/123"); // The 7th arg shareAppLink
  });
});
