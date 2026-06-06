import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  exchangeAppleAuthorizationCode,
  getAppleAudiences,
} from "../../core/apple-auth";
import { prisma } from "../../core/db";
import { sendPasswordResetEmail } from "../../core/email";
import { env } from "../../core/env";
import { AppError } from "../../core/errors";
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  SocialLoginBody,
} from "./user.schemas";

const BCRYPT_ROUNDS = 10;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function registerUser(input: RegisterBody) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        passwordHash,
        name: input.name?.trim() || null,
      },
    });
    return user;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      throw new AppError(
        "EMAIL_TAKEN",
        "Bu e-posta ile zaten bir hesap var.",
        409
      );
    }
    throw e;
  }
}

export async function verifyLogin(input: LoginBody) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (!user || !user.passwordHash) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "E-posta veya şifre hatalı.",
      401
    );
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "E-posta veya şifre hatalı.",
      401
    );
  }
  return user;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "Kullanıcı bulunamadı.", 404);
  }
  return user;
}

// ─── Social Login ────────────────────────────────────────────────────────────

async function verifyGoogleToken(
  token: string
): Promise<{ googleId: string; email: string; name?: string }> {
  try {
    const isIdToken = token.split(".").length === 3;
    const param = isIdToken ? `id_token=${token}` : `access_token=${token}`;
    const url = `https://oauth2.googleapis.com/tokeninfo?${param}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Google token doğrulaması başarısız.");
    }
    const data = (await res.json()) as {
      sub?: string;
      user_id?: string;
      email?: string;
      name?: string;
      aud?: string;
      audience?: string;
      error_description?: string;
    };

    if (data.error_description) {
      throw new Error(data.error_description);
    }

    const googleId = data.sub || data.user_id;
    if (!googleId || !data.email) {
      throw new Error("Google token geçersiz.");
    }

    const audience = data.aud || data.audience;
    if (env.GOOGLE_CLIENT_ID && audience) {
      const audiences = audience.split(",").map((s) => s.trim());
      if (!audiences.includes(env.GOOGLE_CLIENT_ID)) {
        throw new Error("Google token bu uygulama için geçerli değil.");
      }
    }

    return { googleId, email: data.email, name: data.name };
  } catch (e) {
    throw new AppError(
      "GOOGLE_AUTH_FAILED",
      e instanceof Error ? e.message : "Google girişi başarısız.",
      401
    );
  }
}

const appleJWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

async function verifyAppleToken(
  identityToken: string
): Promise<{ appleId: string; email?: string }> {
  try {
    const audiences = getAppleAudiences();
    const { payload } = await jwtVerify(identityToken, appleJWKS, {
      issuer: "https://appleid.apple.com",
      ...(audiences.length > 0 ? { audience: audiences } : {}),
    });

    if (!payload.sub) {
      throw new Error("Apple token geçersiz: sub eksik.");
    }

    return {
      appleId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch (e) {
    throw new AppError(
      "APPLE_AUTH_FAILED",
      e instanceof Error ? e.message : "Apple girişi başarısız.",
      401
    );
  }
}

async function resolveAppleIdentityToken(input: SocialLoginBody) {
  if (input.idToken) return input.idToken;
  if (input.code && input.redirectUri) {
    return exchangeAppleAuthorizationCode(input.code, input.redirectUri);
  }
  throw new AppError(
    "VALIDATION_ERROR",
    "Apple girişi için idToken veya code+redirectUri gerekli.",
    400
  );
}

export async function socialLogin(input: SocialLoginBody) {
  let providerId: string;
  let email: string | undefined;
  let name: string | undefined = input.name;

  if (input.provider === "google") {
    const verified = await verifyGoogleToken(input.idToken!);
    providerId = verified.googleId;
    email = verified.email;
    if (!name) name = verified.name;
  } else {
    const identityToken = await resolveAppleIdentityToken(input);
    const verified = await verifyAppleToken(identityToken);
    providerId = verified.appleId;
    email = verified.email;
  }

  const idField =
    input.provider === "google"
      ? { googleId: providerId }
      : { appleId: providerId };

  // Find existing user by provider ID
  let user = await prisma.user.findFirst({ where: idField });

  if (!user && email) {
    // Check if email already exists → link the social provider
    user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: idField,
      });
    }
  }

  if (!user) {
    if (!email) {
      throw new AppError(
        "SOCIAL_NO_EMAIL",
        "E-posta adresi alınamadı. Lütfen e-posta/şifre ile kayıt olun.",
        400
      );
    }
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        ...idField,
      },
    });
  }

  return user;
}

// ─── Forgot / Reset Password ─────────────────────────────────────────────────

function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestPasswordReset(input: ForgotPasswordBody) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  // Don't reveal whether the account exists
  if (!user) return;

  const code = generateResetCode();
  const expires = new Date(Date.now() + RESET_CODE_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetCode: code, resetCodeExpires: expires },
  });

  await sendPasswordResetEmail(user.email, code);
}

export async function resetPassword(input: ResetPasswordBody) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (
    !user ||
    !user.resetCode ||
    !user.resetCodeExpires ||
    user.resetCode !== input.code.trim() ||
    user.resetCodeExpires < new Date()
  ) {
    throw new AppError(
      "INVALID_RESET_CODE",
      "Kod hatalı veya süresi dolmuş.",
      400
    );
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetCode: null, resetCodeExpires: null },
  });

  return user;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordBody
) {
  const user = await getUserById(userId);

  if (!user.passwordHash) {
    throw new AppError(
      "NO_PASSWORD",
      "Bu hesap sosyal giriş ile oluşturulmuş. Şifre oluşturmak için sıfırlama akışını kullanın.",
      400
    );
  }

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) {
    throw new AppError("INVALID_CREDENTIALS", "Mevcut şifre hatalı.", 401);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
