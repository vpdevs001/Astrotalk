import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Registers baseline security middleware (helmet + cors).
 * Wrapped with fastify-plugin so it attaches to the parent scope
 * instead of being encapsulated.
 */
export default fp(
  async function securityPlugin(fastify: FastifyInstance) {
    await fastify.register(helmet);
    await fastify.register(cors, { origin: true });
  },
  { name: "security-plugin" },
);
