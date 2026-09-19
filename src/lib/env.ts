import { z } from "zod";

/*
  Phase 2 - Step 26: Strict Environment Validation
  This guarantees the app crashes at boot if a critical variable is missing,
  preventing silent failures in production.
*/

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Authentication
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for OAuth"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required for OAuth"),
  MASTER_ADMIN_EMAIL: z
    .string()
    .email("MASTER_ADMIN_EMAIL must be a valid email"),

  // Email System (Hostinger 100/day limit)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().regex(/^\d+$/, "SMTP_PORT must be a number string"),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  ADMIN_RECEIVER_EMAIL: z
    .string()
    .email("ADMIN_RECEIVER_EMAIL must be a valid email"),

  // External APIs (DataImpulse reseller auth = dashboard login + password,
  // POST formdata per docs/03 §1 — never a single API key)
  DATAIMPULSE_API_LOGIN: z.string().min(1, "DATAIMPULSE_API_LOGIN is required"),
  DATAIMPULSE_API_PASSWORD: z
    .string()
    .min(1, "DATAIMPULSE_API_PASSWORD is required"),

  // Image Uploads
  IMGBB_API_KEY: z.string().min(1, "IMGBB_API_KEY is required for avatar uploads").optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  console.error(_env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
