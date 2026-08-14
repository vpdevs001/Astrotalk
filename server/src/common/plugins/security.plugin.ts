import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env.js";

/**
 * Registers baseline security middleware (helmet + cors).
 * Wrapped with fastify-plugin so it attaches to the parent scope
 * instead of being encapsulated.
 */
export default fp(
  async function securityPlugin(fastify: FastifyInstance) {
    const allowedOrigins = env.CLIENT_URL.split(",").map((origin) => origin.trim());

    await fastify.register(helmet);
    await fastify.register(cors, { origin: allowedOrigins });
  },
  { name: "security-plugin" },
);
