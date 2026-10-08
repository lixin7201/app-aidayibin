import type { NextRequest } from "next/server";

import { AppError, errorCodes } from "@/lib/http/errors";

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    request.headers.get("x-real-ip") ??
    forwardedFor?.at(-1) ??
    "127.0.0.1"
  );
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export async function parseJsonBody<T>(
  request: NextRequest,
  options: { maxBytes?: number } = {},
) {
  const contentLength = Number(request.headers.get("content-length"));

  if (
    options.maxBytes &&
    Number.isFinite(contentLength) &&
    contentLength > options.maxBytes
  ) {
    throw new AppError(errorCodes.INVALID_REQUEST, "请求体过大", 413);
  }

  const body = await request.text();

  if (
    options.maxBytes &&
    new TextEncoder().encode(body).byteLength > options.maxBytes
  ) {
    throw new AppError(errorCodes.INVALID_REQUEST, "请求体过大", 413);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new AppError(errorCodes.INVALID_REQUEST, "请求内容不是有效 JSON", 400);
  }
}
