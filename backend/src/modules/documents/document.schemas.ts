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
  /**
   * Şimdilik dosya upload yok; test için ham metin gönderiyoruz.
   * İleride OCR / PDF text extraction buraya bağlanacak.
   */
  text: z.string().min(1).max(20000).optional(),
});

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type AnalyzeDocumentBody = z.infer<typeof analyzeDocumentBodySchema>;

