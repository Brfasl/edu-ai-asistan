import type { FastifyPluginAsync } from "fastify";
import { usersPlugin } from "../users/users.plugin";

/**
 * Tüm sürümlenmiş JSON API uçları burada veya buraya kayıtlı alt eklentilerde büyür.
 */
export const v1Plugin: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    name: "edu-ai-asistan-api",
    version: "0.1.0",
    docs: "Kullanıcı: POST /api/v1/users/register, /login, GET /me (Authorization: Bearer).",
  }));

  await app.register(usersPlugin, { prefix: "/users" });
};
