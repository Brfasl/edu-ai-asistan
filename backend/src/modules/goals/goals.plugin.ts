import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../core/errors";
import { createGoalBodySchema } from "./goals.schemas";
import { createGoal, deleteGoal, listGoals } from "./goals.service";

export const goalsPlugin: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const goals = await listGoals(sub);
    return { goals };
  });

  app.post("/", async (request, reply) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = createGoalBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const goal = await createGoal(sub, parsed.data);
    return reply.status(201).send({ goal });
  });

  app.delete("/:id", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    await deleteGoal(sub, id);
    return { ok: true };
  });
};
