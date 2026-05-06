import type { FastifyPluginAsync } from "fastify";
import { documentsPlugin } from "../documents/documents.plugin";
import { statisticsPlugin } from "../statistics/statistics.plugin";
import { usersPlugin } from "../users/users.plugin";

/**
 * Tüm sürümlenmiş JSON API uçları burada veya buraya kayıtlı alt eklentilerde büyür.
 */
export const v1Plugin: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    name: "edu-ai-asistan-api",
    version: "0.1.0",
    docs: [
      "Kullanıcı: POST /api/v1/users/register, /login, GET /me (Bearer).",
      "Belgeler: GET/POST /api/v1/documents, GET/PATCH/DELETE /api/v1/documents/:id (Bearer).",
      "İstatistik: POST /api/v1/stats/activity, GET /api/v1/stats/weekly-summary, GET /api/v1/stats/course-performance (Bearer).",
    ].join(" "),
  }));

  await app.register(usersPlugin, { prefix: "/users" });
  await app.register(documentsPlugin, { prefix: "/documents" });
  await app.register(statisticsPlugin, { prefix: "/stats" });
};
