import { z } from "zod";

export const createActivityBodySchema = z.object({
  type: z.enum(["study", "test", "xp"]),
  minutes: z.number().int().positive().optional(),
  count: z.number().int().positive().optional(),
  xp: z.number().int().positive().optional(),
  course: z.string().min(1).max(120).optional(),
});

export const weeklySummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export type CreateActivityBody = z.infer<typeof createActivityBodySchema>;
export type WeeklySummaryQuery = z.infer<typeof weeklySummaryQuerySchema>;

