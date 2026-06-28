import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalString = z.preprocess(emptyStringToUndefined, z.string().optional());
const optionalUrl = z.preprocess(
  emptyStringToUndefined,
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ENABLE_MOCKS: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  APIMART_API_KEY: optionalString,
  APIMART_BASE_URL: z
    .string()
    .url()
    .default("https://api.apimart.ai"),
  IMAGE_STORAGE_PROVIDER: z
    .enum(["r2", "aliyun_oss", "local"])
    .default("r2"),
  CLOUDFLARE_R2_ACCOUNT_ID: optionalString,
  CLOUDFLARE_R2_ACCESS_KEY_ID: optionalString,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: optionalString,
  CLOUDFLARE_R2_BUCKET: optionalString,
  CLOUDFLARE_R2_PUBLIC_BASE_URL: optionalUrl,
  ALIYUN_OSS_REGION: optionalString,
  ALIYUN_OSS_ENDPOINT: optionalUrl,
  ALIYUN_OSS_BUCKET: optionalString,
  ALIYUN_OSS_ACCESS_KEY_ID: optionalString,
  ALIYUN_OSS_ACCESS_KEY_SECRET: optionalString,
  ALIYUN_OSS_PUBLIC_BASE_URL: optionalUrl,
  LOCAL_IMAGE_STORAGE_DIR: optionalString,
  LOCAL_IMAGE_PUBLIC_BASE_URL: optionalUrl,
  APP_AUTH_VERIFY_URL: optionalUrl,
  APP_AUTH_SHARED_SECRET: optionalString,
  APP_SESSION_SECRET: optionalString,
  GAOKAO_LLM_BASE_URL: optionalUrl,
  GAOKAO_LLM_API_KEY: optionalString,
  GAOKAO_LLM_MODEL: optionalString,
  GAOKAO_LLM_REPORT_MODEL: optionalString,
  GAOKAO_ADVISOR_BASE_URL: optionalUrl,
  GAOKAO_ADVISOR_API_KEY: optionalString,
  GAOKAO_ADVISOR_TIMEOUT_MS: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().positive().max(60_000).default(15_000),
  ),
  GAOKAO_UNLIMITED_TEST_USER_IDS: optionalString,
  WECHAT_APP_ID: optionalString,
  WECHAT_APP_SECRET: optionalString,
  WECHAT_OAUTH_REDIRECT_URL: optionalUrl,
  NEXT_PUBLIC_WECHAT_MINI_PROGRAM_APP_ID: optionalString,
  NEXT_PUBLIC_WECHAT_MINI_PROGRAM_ORIGINAL_ID: optionalString,
  NEXT_PUBLIC_WECHAT_MINI_PROGRAM_WEBVIEW_PATH: z
    .preprocess(emptyStringToUndefined, z.string().optional())
    .default("/subPack/information/webviewMini"),
  ADMIN_SESSION_PASSWORD: z.string().default("dayibin-admin-dev"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment: ${parsedEnv.error.message}`);
}

export const config = parsedEnv.data;

export const isMockEnabled =
  config.NODE_ENV !== "production" && config.NEXT_PUBLIC_ENABLE_MOCKS;

export function requireServerEnv(name: keyof typeof config) {
  const value = config[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function assertProductionAdminPasswordConfigured() {
  if (
    config.NODE_ENV === "production" &&
    config.ADMIN_SESSION_PASSWORD === "dayibin-admin-dev"
  ) {
    throw new Error(
      "Invalid production environment: ADMIN_SESSION_PASSWORD must be changed",
    );
  }
}
