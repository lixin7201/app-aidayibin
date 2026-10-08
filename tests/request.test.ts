import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getClientIp, parseJsonBody } from "@/lib/http/request";

function requestWithHeaders(headers: HeadersInit) {
  return { headers: new Headers(headers) } as NextRequest;
}

describe("getClientIp", () => {
  it("trusts the reverse proxy x-real-ip over a spoofed forwarded chain", () => {
    expect(
      getClientIp(
        requestWithHeaders({
          "x-real-ip": "203.0.113.10",
          "x-forwarded-for": "127.0.0.1, 203.0.113.10",
        }),
      ),
    ).toBe("203.0.113.10");
  });

  it("uses the proxy-appended end of x-forwarded-for as fallback", () => {
    expect(
      getClientIp(
        requestWithHeaders({
          "x-forwarded-for": "127.0.0.1, 203.0.113.10",
        }),
      ),
    ).toBe("203.0.113.10");
  });
});

describe("parseJsonBody", () => {
  it("rejects bodies over the configured byte limit", async () => {
    const request = new Request("https://example.com/api", {
      method: "POST",
      body: JSON.stringify({ token: "x".repeat(100) }),
      headers: { "content-type": "application/json" },
    }) as NextRequest;

    await expect(parseJsonBody(request, { maxBytes: 32 })).rejects.toThrow(
      "请求体过大",
    );
  });

  it("rejects malformed JSON instead of silently returning an empty object", async () => {
    const request = new Request("https://example.com/api", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    }) as NextRequest;

    await expect(parseJsonBody(request)).rejects.toThrow(
      "请求内容不是有效 JSON",
    );
  });
});
