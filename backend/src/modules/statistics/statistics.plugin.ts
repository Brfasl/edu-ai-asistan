import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../core/errors";
import {
  createActivityBodySchema,
  weeklySummaryQuerySchema,
} from "./statistics.schemas";
import {
  createActivity,
  getCoursePerformance,
  getDailyActivity,
  getProfileStats,
  getWeeklySummary,
} from "./statistics.service";

export const statisticsPlugin: FastifyPluginAsync = async (app) => {
  app.post("/activity", async (request, reply) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = createActivityBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const activity = await createActivity(sub, parsed.data);
    return reply.status(201).send({ activity });
  });

  app.get("/weekly-summary", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = weeklySummaryQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const summary = await getWeeklySummary(sub, parsed.data);
    return { summary };
  });

  app.get("/course-performance", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = weeklySummaryQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const performance = await getCoursePerformance(sub, parsed.data);
    return { performance };
  });

  app.get("/daily-activity", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = weeklySummaryQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const data = await getDailyActivity(sub, parsed.data);
    return data;
  });

  app.get("/profile-stats", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const data = await getProfileStats(sub);
    return data;
  });
};

