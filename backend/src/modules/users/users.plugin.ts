import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../core/errors";
import { loginBodySchema, registerBodySchema } from "./user.schemas";
import {
  getUserById,
  registerUser,
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
    return reply.status(201).send({
      user: toPublicUser(user),
      token,
    });
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

  app.get("/me", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const user = await getUserById(sub);
    return { user: toPublicUser(user) };
  });
};
