import type { FastifyInstance } from "fastify";

import { checkDbConnection } from "../../db/client.js";
import { SuccessResponse } from "../../common/utils/index.js";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    const dbConnected = await checkDbConnection();
    return new SuccessResponse({
      healthy: dbConnected,
      uptime: process.uptime(),
      db: dbConnected ? "connected" : "unreachable",
    });
  });
}
