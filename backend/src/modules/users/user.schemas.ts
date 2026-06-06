import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı."),
  name: z.string().min(1).max(120).optional(),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const socialLoginBodySchema = z
  .object({
    provider: z.enum(["google", "apple"]),
    idToken: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    redirectUri: z.string().min(1).optional(),
    name: z.string().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "google" && !data.idToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Google girişi için idToken gerekli.",
      });
    }
    if (
      data.provider === "apple" &&
      !data.idToken &&
      !(data.code && data.redirectUri)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Apple girişi için idToken veya code+redirectUri gerekli.",
      });
    }
  });

export const forgotPasswordBodySchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
});

export const resetPasswordBodySchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin."),
  code: z.string().min(1),
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı."),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı."),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type SocialLoginBody = z.infer<typeof socialLoginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
