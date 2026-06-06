import type { FastifyPluginAsync } from "fastify";
import { aiPlugin } from "../ai/ai.plugin";
import { documentsPlugin } from "../documents/documents.plugin";
import { goalsPlugin } from "../goals/goals.plugin";
import { statisticsPlugin } from "../statistics/statistics.plugin";
import { usersPlugin } from "../users/users.plugin";

export const v1Plugin: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    name: "edu-ai-asistan-api",
    version: "0.1.0",
  }));

  await app.register(usersPlugin, { prefix: "/users" });
  await app.register(documentsPlugin, { prefix: "/documents" });
  await app.register(goalsPlugin, { prefix: "/goals" });
  await app.register(statisticsPlugin, { prefix: "/stats" });
  await app.register(aiPlugin, { prefix: "/ai" });
};
