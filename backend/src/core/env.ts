import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET en az 32 karakter olmalı."),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY zorunlu."),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  // E-posta (isteğe bağlı — yoksa şifre sıfırlama kodu console'a yazılır)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  // Google OAuth (isteğe bağlı)
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Apple Sign In (isteğe bağlı)
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_SERVICE_ID: z.string().optional(),
  APPLE_BUNDLE_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}

export const env: Env = loadEnv();
