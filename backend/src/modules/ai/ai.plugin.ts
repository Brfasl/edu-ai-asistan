import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { loadEnv } from "../../core/env";
import { AppError } from "../../core/errors";
import { chatWithAI } from "./ai.service";

const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
  goals: z
    .array(
      z.object({
        title: z.string().max(100),
        daysLeft: z.number().int(),
      })
    )
    .optional()
    .default([]),
});

export const aiPlugin: FastifyPluginAsync = async (app) => {
  app.post("/chat", async (request, reply) => {
    await request.jwtVerify<{ sub: string }>();
    const parsed = chatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }

    const env = loadEnv();
    const reply_text = await chatWithAI(
      parsed.data.messages,
      parsed.data.goals,
      env.GEMINI_API_KEY,
      env.GEMINI_MODEL
    );

    return reply.send({ reply: reply_text });
  });
};
