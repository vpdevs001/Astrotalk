import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { AppError } from "../errors/index.js";
import { ErrorResponse } from "../utils/index.js";

/**
 * Registers the global 404 handler and centralized error handler.
 * Wrapped with fastify-plugin so it attaches to the parent scope.
 */
export default fp(
  async function errorHandlerPlugin(fastify: FastifyInstance) {
    fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
      reply
        .status(404)
        .send(new ErrorResponse(`Route ${request.method} ${request.url} not found`, "NotFound"));
    });

    fastify.setErrorHandler(
      (error: FastifyError | AppError, _request: FastifyRequest, reply: FastifyReply) => {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send(new ErrorResponse(error.message, error.name));
        }

        // Fastify's own validation errors carry a statusCode.
        const statusCode = "statusCode" in error && error.statusCode ? error.statusCode : 500;

        if (statusCode >= 500) {
          fastify.log.error(error);
        } else {
          fastify.log.warn(error);
        }

        const message = statusCode >= 500 ? "Internal Server Error" : error.message;
        return reply.status(statusCode).send(new ErrorResponse(message, error.name ?? "Error"));
      },
    );
  },
  { name: "error-handler-plugin" },
);
