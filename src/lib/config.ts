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
    .transform((value) => value !== "false"),
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  APIMART_API_KEY: optionalString,
  APIMART_BASE_URL: z
    .string()
    .url()
    .default("https://api.apimart.ai"),
  CLOUDFLARE_R2_ACCOUNT_ID: optionalString,
  CLOUDFLARE_R2_ACCESS_KEY_ID: optionalString,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: optionalString,
  CLOUDFLARE_R2_BUCKET: optionalString,
  CLOUDFLARE_R2_PUBLIC_BASE_URL: optionalUrl,
  APP_AUTH_VERIFY_URL: optionalUrl,
  APP_AUTH_SHARED_SECRET: optionalString,
  APP_SESSION_SECRET: optionalString,
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
