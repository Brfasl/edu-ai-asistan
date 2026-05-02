import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/db";
import { AppError } from "../../core/errors";
import type { LoginBody, RegisterBody } from "./user.schemas";

const BCRYPT_ROUNDS = 10;

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
  if (!user) {
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
