import { z } from "zod";

export const createDocumentBodySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["pdf", "image", "other"]),
  sizeBytes: z.number().int().positive().optional(),
});

export const listDocumentsQuerySchema = z.object({
  status: z.enum(["pending", "done", "failed"]).optional(),
});

export const updateDocumentBodySchema = z.object({
  status: z.enum(["pending", "done", "failed"]).optional(),
  name: z.string().min(1).max(255).optional(),
});

export const analyzeDocumentBodySchema = z.object({
  text: z.string().min(1).max(20000).optional(),
});

export const targetedQuizBodySchema = z.object({
  wrongQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        correctAnswer: z.string().min(1),
      })
    )
    .min(1)
    .max(10),
});

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type AnalyzeDocumentBody = z.infer<typeof analyzeDocumentBodySchema>;
export type TargetedQuizBody = z.infer<typeof targetedQuizBodySchema>;

