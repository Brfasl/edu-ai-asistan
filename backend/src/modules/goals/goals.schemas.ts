import { z } from "zod";

export const createGoalBodySchema = z.object({
  title: z.string().min(1).max(120),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin (YYYY-MM-DD)."),
  color: z.string().max(20).optional(),
  emoji: z.string().max(8).optional(),
});

export type CreateGoalBody = z.infer<typeof createGoalBodySchema>;
