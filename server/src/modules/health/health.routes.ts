import type { FastifyInstance } from "fastify";

import { SuccessResponse } from "../../common/utils/index.js";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    return new SuccessResponse({ healthy: true, uptime: process.uptime() });
  });
}
