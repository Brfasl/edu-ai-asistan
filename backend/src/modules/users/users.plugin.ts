import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../core/errors";
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  socialLoginBodySchema,
} from "./user.schemas";
import {
  changePassword,
  getUserById,
  registerUser,
  requestPasswordReset,
  resetPassword,
  socialLogin,
  toPublicUser,
  verifyLogin,
} from "./users.service";

export const usersPlugin: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const user = await registerUser(parsed.data);
    const token = await reply.jwtSign(
      { sub: user.id },
      { expiresIn: "7d" }
    );
    return reply.status(201).send({ user: toPublicUser(user), token });
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const user = await verifyLogin(parsed.data);
    const token = await reply.jwtSign(
      { sub: user.id },
      { expiresIn: "7d" }
    );
    return { user: toPublicUser(user), token };
  });

  app.post("/social-login", async (request, reply) => {
    const parsed = socialLoginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const user = await socialLogin(parsed.data);
    const token = await reply.jwtSign(
      { sub: user.id },
      { expiresIn: "7d" }
    );
    return { user: toPublicUser(user), token };
  });

  app.post("/forgot-password", async (request) => {
    const parsed = forgotPasswordBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Geçerli bir e-posta girin.", 400);
    }
    await requestPasswordReset(parsed.data);
    // Always return success to avoid revealing whether email exists
    return { ok: true };
  });

  app.post("/reset-password", async (request) => {
    const parsed = resetPasswordBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    await resetPassword(parsed.data);
    return { ok: true };
  });

  app.post("/change-password", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = changePasswordBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    await changePassword(sub, parsed.data);
    return { ok: true };
  });

  app.get("/me", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const user = await getUserById(sub);
    return { user: toPublicUser(user) };
  });
};
