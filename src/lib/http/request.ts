import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export async function parseJsonBody<T>(request: NextRequest) {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
