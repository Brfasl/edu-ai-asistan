import type { Document, DocumentStatus, DocumentType } from "@prisma/client";
import { prisma } from "../../core/db";
import { AppError } from "../../core/errors";
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

  // Basit akış: analiz başlıyor → pending; analiz bitti → done + analysis kaydı.
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "pending" },
  });

  const sourceText = input.text?.trim() ?? "";
  const summary =
    sourceText.length > 0
      ? `Özet: ${sourceText.slice(0, 220)}${sourceText.length > 220 ? "..." : ""}`
      : "Özet: (metin gelmedi) Bu belge için analiz tamamlandı.";

  const analysis = await prisma.documentAnalysis.upsert({
    where: { documentId },
    create: {
      documentId,
      inputText: sourceText.length > 0 ? sourceText : null,
      summary,
    },
    update: {
      inputText: sourceText.length > 0 ? sourceText : null,
      summary,
    },
  });

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { status: "done" },
  });

  return {
    document: toPublicDocument(updated),
    analysis: {
      id: analysis.id,
      documentId: analysis.documentId,
      summary: analysis.summary,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
    },
  };
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
  return {
    id: analysis.id,
    documentId: analysis.documentId,
    summary: analysis.summary,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  };
}

