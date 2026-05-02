import type { FastifyPluginAsync } from "fastify";

/**
 * Load balancer / readiness probe — keeps infra concerns in one place.
 */
export const healthPlugin: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    service: "edu-ai-asistan-api",
  }));
};
