import type { FastifyPluginAsync } from "fastify";
import { AppError } from "../../core/errors";
import {
  analyzeDocumentBodySchema,
  createDocumentBodySchema,
  listDocumentsQuerySchema,
  updateDocumentBodySchema,
} from "./document.schemas";
import {
  analyzeDocument,
  createDocument,
  deleteDocument,
  getDocument,
  getDocumentAnalysis,
  listDocuments,
  updateDocument,
} from "./documents.service";

export const documentsPlugin: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = listDocumentsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const documents = await listDocuments(sub, parsed.data);
    return { documents };
  });

  app.post("/", async (request, reply) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const parsed = createDocumentBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const document = await createDocument(sub, parsed.data);
    return reply.status(201).send({ document });
  });

  app.get("/:id", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    const document = await getDocument(sub, id);
    return { document };
  });

  app.patch("/:id", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    const parsed = updateDocumentBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const document = await updateDocument(sub, id, parsed.data);
    return { document };
  });

  app.delete("/:id", async (request, reply) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    await deleteDocument(sub, id);
    return reply.status(204).send();
  });

  app.post("/:id/analyze", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    const parsed = analyzeDocumentBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Geçersiz istek.",
        400,
        parsed.error.flatten()
      );
    }
    const result = await analyzeDocument(sub, id, parsed.data);
    return result;
  });

  app.get("/:id/analysis", async (request) => {
    const { sub } = await request.jwtVerify<{ sub: string }>();
    const { id } = request.params as { id: string };
    const analysis = await getDocumentAnalysis(sub, id);
    return { analysis };
  });
};

