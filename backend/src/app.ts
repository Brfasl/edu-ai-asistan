import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { registerHttpResponses } from "./core/http-responses";
import type { Env } from "./core/env";
import { v1Plugin } from "./modules/api/v1.plugin";
import { healthPlugin } from "./modules/health/health.plugin";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  registerHttpResponses(app, env);

  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(healthPlugin);
  await app.register(v1Plugin, { prefix: "/api/v1" });

  return app;
}
