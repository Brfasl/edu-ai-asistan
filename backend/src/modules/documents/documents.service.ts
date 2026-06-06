import type { Document, DocumentStatus, DocumentType } from "@prisma/client";
import { prisma } from "../../core/db";
import { AppError } from "../../core/errors";
import { loadEnv } from "../../core/env";
import { analyzeFileWithGemini } from "../ai/gemini.client";
import type {
  AnalyzeDocumentBody,
  CreateDocumentBody,
  ListDocumentsQuery,
  UpdateDocumentBody,
} from "./document.schemas";

function toPublicDocument(doc: Document) {
  return {
    id: doc.id,
    ownerId: doc.ownerId,
    name: doc.name,
    type: doc.type,
    status: doc.status,
    sizeBytes: doc.sizeBytes,
    storagePath: doc.storagePath ?? null,
    mimeType: doc.mimeType ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toPublicAnalysis(analysis: {
  id: string;
  documentId: string;
  summary: string;
  resultJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: analysis.id,
    documentId: analysis.documentId,
    summary: analysis.summary,
    resultJson: analysis.resultJson ?? null,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  };
}

export async function createDocument(ownerId: string, input: CreateDocumentBody) {
  const doc = await prisma.document.create({
    data: {
      ownerId,
      name: input.name.trim(),
      type: input.type as DocumentType,
      sizeBytes: input.sizeBytes,
    },
  });
  return toPublicDocument(doc);
}

export async function createUploadedDocument(ownerId: string, input: {
  name: string;
  type: DocumentType;
  sizeBytes?: number;
  storagePath: string;
  mimeType?: string | null;
}) {
  const doc = await prisma.document.create({
    data: {
      ownerId,
      name: input.name.trim(),
      type: input.type,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      mimeType: input.mimeType ?? undefined,
    },
  });
  return toPublicDocument(doc);
}

export async function listDocuments(ownerId: string, query: ListDocumentsQuery) {
  const docs = await prisma.document.findMany({
    where: {
      ownerId,
      status: query.status as DocumentStatus | undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(toPublicDocument);
}

export async function getDocument(ownerId: string, id: string) {
  const doc = await prisma.document.findFirst({ where: { id, ownerId } });
  if (!doc) {
    throw new AppError("DOCUMENT_NOT_FOUND", "Belge bulunamadı.", 404);
  }
  return toPublicDocument(doc);
}

export async function updateDocument(
  ownerId: string,
  id: string,
  input: UpdateDocumentBody
) {
  const existing = await prisma.document.findFirst({ where: { id, ownerId } });
  if (!existing) {
    throw new AppError("DOCUMENT_NOT_FOUND", "Belge bulunamadı.", 404);
  }

  const doc = await prisma.document.update({
    where: { id },
    data: {
      status: input.status as DocumentStatus | undefined,
      name: input.name?.trim(),
    },
  });
  return toPublicDocument(doc);
}

export async function deleteDocument(ownerId: string, id: string) {
  const existing = await prisma.document.findFirst({ where: { id, ownerId } });
  if (!existing) {
    throw new AppError("DOCUMENT_NOT_FOUND", "Belge bulunamadı.", 404);
  }
  await prisma.document.delete({ where: { id } });
}

export async function analyzeDocument(
  ownerId: string,
  documentId: string,
  input: AnalyzeDocumentBody
) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId } });
  if (!doc) {
    throw new AppError("DOCUMENT_NOT_FOUND", "Belge bulunamadı.", 404);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "pending" },
  });

  try {
    const env = loadEnv();

    let analysisResult;

    if (doc.storagePath) {
      // Dosya sunucuda mevcut → Gemini'ye gönder
      const mimeType = doc.mimeType || (doc.type === "pdf" ? "application/pdf" : "image/png");
      analysisResult = await analyzeFileWithGemini(doc.storagePath, mimeType, env.GEMINI_API_KEY, env.GEMINI_MODEL);
    } else if (input.text && input.text.trim().length > 0) {
      // Dosya yok ama ham metin gönderilmiş (fallback)
      const sourceText = input.text.trim();
      analysisResult = {
        summary: sourceText.slice(0, 500),
        insights: [],
        keyTerms: [],
        studyPlan: [],
      };
    } else {
      throw new AppError("DOCUMENT_FILE_MISSING", "Analiz için dosya veya metin gerekli.", 400);
    }

    const analysis = await prisma.documentAnalysis.upsert({
      where: { documentId },
      create: {
        documentId,
        inputText: input.text?.trim() || null,
        summary: analysisResult.summary,
        resultJson: analysisResult as object,
      },
      update: {
        inputText: input.text?.trim() || null,
        summary: analysisResult.summary,
        resultJson: analysisResult as object,
      },
    });

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { status: "done" },
    });

    return {
      document: toPublicDocument(updated),
      analysis: toPublicAnalysis(analysis),
    };
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed" },
    });
    if (err instanceof AppError) throw err;
    throw new AppError(
      "ANALYSIS_FAILED",
      err instanceof Error ? err.message : "Analiz sırasında bir hata oluştu.",
      500
    );
  }
}

export async function getDocumentAnalysis(ownerId: string, documentId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, ownerId } });
  if (!doc) {
    throw new AppError("DOCUMENT_NOT_FOUND", "Belge bulunamadı.", 404);
  }
  const analysis = await prisma.documentAnalysis.findUnique({ where: { documentId } });
  if (!analysis) {
    throw new AppError("ANALYSIS_NOT_FOUND", "Bu belge için analiz yok.", 404);
  }
  return toPublicAnalysis(analysis);
}

