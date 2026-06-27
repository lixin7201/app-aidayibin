import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("buildResultSharePageUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("builds correct share page url and avoids double /ai prefix", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/ai";
    process.env.NEXT_PUBLIC_BASE_PATH = "/ai";

    const { buildResultSharePageUrl } = await import("@/lib/share/result-share");
    
    const url = buildResultSharePageUrl("photo", "task-123", "token_abc");
    
    expect(url).toBe("http://localhost:3000/ai/share/photo/task-123?s=token_abc");
    expect(url).not.toContain("/ai/ai/");
  });

  it("upgrades public http share page urls to https for WeChat sharing", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://ces.dayibin.cn/ai";
    process.env.NEXT_PUBLIC_BASE_PATH = "/ai";

    const { buildResultSharePageUrl } = await import("@/lib/share/result-share");

    expect(buildResultSharePageUrl("fortune", "task-456", "token_xyz")).toBe(
      "https://ces.dayibin.cn/ai/share/fortune/task-456?s=token_xyz",
    );
  });
});
