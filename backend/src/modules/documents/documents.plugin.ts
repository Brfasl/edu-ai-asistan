import type { FastifyPluginAsync } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { AppError } from "../../core/errors";
import {
  analyzeDocumentBodySchema,
  createDocumentBodySchema,
  listDocumentsQuerySchema,
  targetedQuizBodySchema,
  updateDocumentBodySchema,
} from "./document.schemas";
import {
  analyzeDocument,
  createDocument,
  createUploadedDocument,
  deleteDocument,
  getDocument,
  getDocumentAnalysis,
  getTargetedQuiz,
  listDocuments,
  updateDocument,
} from "./documents.service";

export const documentsPlugin: FastifyPluginAsync = async (app) => {
  async function ensureUploadsDir(...parts: string[]) {
    const dir = path.join(process.cwd(), "uploads", ...parts);
    await fs.promises.mkdir(dir, { recursive: true });
    return dir;
  }

  async function getSubjectFromAuth(request: any): Promise<string> {
    // Prefer standard Authorization header, but allow token in query for "open in browser" flows.
    try {
      const verified = (await request.jwtVerify()) as { sub?: string };
      if (!verified?.sub) throw new AppError("UNAUTHORIZED", "Giriş gerekli.", 401);
      return verified.sub;
    } catch {
      const q = (request.query || {}) as Record<string, unknown>;
      const token = typeof q.token === "string" ? q.token : undefined;
      if (!token) throw new AppError("UNAUTHORIZED", "Giriş gerekli.", 401);
      const payload = (app as any).jwt.verify(token) as { sub?: string };
      if (!payload?.sub) throw new AppError("UNAUTHORIZED", "Giriş gerekli.", 401);
      return payload.sub;
    }
  }

  function getMultipartFieldValue(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return getMultipartFieldValue(value[0]);
    if (typeof value === "object" && value !== null && "value" in value) {
      const v = (value as { value?: unknown }).value;
      return typeof v === "string" ? v : undefined;
    }
    return undefined;
  }

  app.get("/", async (request) => {
    const sub = await getSubjectFromAuth(request);
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

  app.get("/:id/file", async (request, reply) => {
    const sub = await getSubjectFromAuth(request);
    const { id } = request.params as { id: string };
    const doc = await getDocument(sub, id);
    if (!doc.storagePath) {
      throw new AppError("DOCUMENT_FILE_MISSING", "Bu belge için dosya bulunamadı.", 404);
    }

    const uploadsRoot = path.join(process.cwd(), "uploads") + path.sep;
    if (!doc.storagePath.startsWith(uploadsRoot)) {
      throw new AppError("FORBIDDEN", "Dosyaya erişim engellendi.", 403);
    }

    try {
      await fs.promises.stat(doc.storagePath);
    } catch {
      throw new AppError("DOCUMENT_FILE_MISSING", "Bu belge için dosya bulunamadı.", 404);
    }

    const contentType =
      doc.mimeType ||
      (doc.type === "pdf" ? "application/pdf" :
       doc.type === "image" ? "image/jpeg" :
       "application/octet-stream");
    const safeBaseName = path.basename(doc.name || "belge").replace(/[\r\n"]/g, "");
    const encoded = encodeURIComponent(doc.name || "belge");

    reply
      .header("Content-Type", contentType)
      .header("Content-Disposition", `inline; filename="${safeBaseName}"; filename*=UTF-8''${encoded}`);

    return reply.send(fs.createReadStream(doc.storagePath));
  });

  app.post("/upload", async (request, reply) => {
    const sub = await getSubjectFromAuth(request);

    // Accept multipart form fields: file, name?, type?, sizeBytes?, mimeType?
    // @fastify/multipart decorates request.file()
    const filePart: MultipartFile | undefined = await request.file();
    if (!filePart) {
      throw new AppError("VALIDATION_ERROR", "Dosya bulunamadı.", 400);
    }

    const fields = (filePart.fields || {}) as Record<string, unknown>;
    const nameRaw = getMultipartFieldValue(fields.name) || filePart.filename || "Belge";
    const typeRaw = getMultipartFieldValue(fields.type);
    const sizeBytesRaw = getMultipartFieldValue(fields.sizeBytes);
    const mimeTypeRaw = getMultipartFieldValue(fields.mimeType) || filePart.mimetype;

    const lower = String(nameRaw).toLowerCase();
    const inferredType = lower.endsWith(".pdf")
      ? "pdf"
      : lower.match(/\.(png|jpg|jpeg|webp)$/)
        ? "image"
        : "other";
    const type = (typeRaw === "pdf" || typeRaw === "image" || typeRaw === "other")
      ? typeRaw
      : inferredType;

    const uploadsDir = await ensureUploadsDir(sub);
    const safeName = `${Date.now()}-${filePart.filename || "upload"}`.replace(/[^\w.\-]/g, "_");
    const fullPath = path.join(uploadsDir, safeName);

    await pipeline(filePart.file, fs.createWriteStream(fullPath));

    const sizeBytes =
      typeof sizeBytesRaw === "string" && sizeBytesRaw.trim() !== ""
        ? Number(sizeBytesRaw)
        : undefined;

    const document = await createUploadedDocument(sub, {
      name: String(nameRaw),
      type,
      sizeBytes: Number.isFinite(sizeBytes as number) ? (sizeBytes as number) : undefined,
      storagePath: fullPath,
      mimeType: mimeTypeRaw ? String(mimeTypeRaw) : null,
    } as any);

    return reply.status(201).send({ document });
  });

  app.post("/", async (request, reply) => {
    const sub = await getSubjectFromAuth(request);
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
    const sub = await getSubjectFromAuth(request);
    const { id } = request.params as { id: string };
    const document = await getDocument(sub, id);
    return { document };
  });

  app.patch("/:id", async (request) => {
    const sub = await getSubjectFromAuth(request);
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
    const sub = await getSubjectFromAuth(request);
    const { id } = request.params as { id: string };
    await deleteDocument(sub, id);
    return reply.status(204).send();
  });

  app.post("/:id/analyze", async (request) => {
    const sub = await getSubjectFromAuth(request);
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
    const sub = await getSubjectFromAuth(request);
    const { id } = request.params as { id: string };
    const analysis = await getDocumentAnalysis(sub, id);
    return { analysis };
  });

  app.post("/:id/targeted-quiz", async (request, reply) => {
    const sub = await getSubjectFromAuth(request);
    const { id } = request.params as { id: string };
    const parsed = targetedQuizBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Geçersiz istek.", 400, parsed.error.flatten());
    }
    const result = await getTargetedQuiz(sub, id, parsed.data);
    return reply.status(200).send(result);
  });
};

