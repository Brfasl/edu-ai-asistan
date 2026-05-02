import type { FastifyError, FastifyInstance } from "fastify";
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

export function registerHttpResponses(app: FastifyInstance, env: Env) {
  app.setErrorHandler((error, _request, reply) => {
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

    const exposeMessage =
      env.NODE_ENV !== "production" && error instanceof Error && error.message
        ? error.message
        : "Sunucu hatası.";

    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: exposeMessage,
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
