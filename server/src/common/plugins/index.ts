import type { FastifyInstance } from "fastify";

import errorHandlerPlugin from "./error-handler.plugin.js";
import securityPlugin from "./security.plugin.js";

/**
 * Registers all common/cross-cutting plugins on the given Fastify instance.
 * Add new global plugins here so app.ts stays declarative.
 */
export async function registerCommonPlugins(fastify: FastifyInstance) {
  await fastify.register(securityPlugin);
  await fastify.register(errorHandlerPlugin);
}
