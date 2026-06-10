import type { FastifyError, FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "./errors";
import type { Env } from "./env";

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function registerHttpResponses(app: FastifyInstance, _env: Env) {
  app.setErrorHandler((error, _request, reply) => {
    // Prisma: DB down / pool timeout / etc. -> always return a safe error body
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      const code = (error as { code?: string }).code;
      const message = error instanceof Error ? error.message : "";
      const dbUnreachable =
        code === "P1001" ||
        code === "P1002" ||
        code === "P2024" ||
        message.includes("Can't reach database server");

      if (dbUnreachable) {
        app.log.error({ err: error }, "Database unavailable");
        return reply.status(503).send({
          error: {
            code: "DB_UNAVAILABLE",
            message:
              "Veritabanına ulaşılamıyor. Lütfen biraz sonra tekrar dene.",
          },
        } satisfies ErrorBody);
      }

      app.log.error({ err: error }, "Database error");
      return reply.status(500).send({
        error: {
          code: "DB_ERROR",
          message: "Veritabanı hatası.",
        },
      } satisfies ErrorBody);
    }

    if (error instanceof AppError) {
      const body: ErrorBody = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
      if (error.details !== undefined) {
        body.error.details = error.details;
      }
      return reply.status(error.statusCode).send(body);
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz istek.",
          details: error.flatten(),
        },
      } satisfies ErrorBody);
    }

    const fastifyError = error as FastifyError;
    if (fastifyError.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz istek.",
          details: fastifyError.validation,
        },
      } satisfies ErrorBody);
    }

    const maybeHttp = error as Error & {
      statusCode?: number;
      code?: string;
    };

    if (
      typeof maybeHttp.statusCode === "number" &&
      maybeHttp.statusCode >= 400 &&
      maybeHttp.statusCode < 500
    ) {
      return reply.status(maybeHttp.statusCode).send({
        error: {
          code: maybeHttp.code ?? "CLIENT_ERROR",
          message:
            maybeHttp.message && maybeHttp.message.length > 0
              ? maybeHttp.message
              : "İstek hatası.",
        },
      } satisfies ErrorBody);
    }

    app.log.error({ err: error }, "Unhandled error");

    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Sunucu hatası.",
      },
    } satisfies ErrorBody);
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Kaynak bulunamadı.",
      },
    } satisfies ErrorBody);
  });
}
