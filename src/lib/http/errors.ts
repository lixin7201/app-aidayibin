import { NextResponse } from "next/server";

export const errorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  TEMPLATE_DISABLED: "TEMPLATE_DISABLED",
  INVALID_IMAGE_COUNT: "INVALID_IMAGE_COUNT",
  INVALID_IMAGE_FORMAT: "INVALID_IMAGE_FORMAT",
  DAILY_LIMIT_REACHED: "DAILY_LIMIT_REACHED",
  CAMPAIGN_LIMIT_REACHED: "CAMPAIGN_LIMIT_REACHED",
  RUNNING_TASK_EXISTS: "RUNNING_TASK_EXISTS",
  SUBMIT_TOO_FREQUENT: "SUBMIT_TOO_FREQUENT",
  PLATFORM_LIMIT_REACHED: "PLATFORM_LIMIT_REACHED",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        code: errorCodes.UNKNOWN_ERROR,
        message: "系统开小差了，请稍后再试",
      },
    },
    { status: 500 },
  );
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
