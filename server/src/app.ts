import fastify, { type FastifyInstance } from "fastify";

import { env } from "./common/config/env.js";
import { registerCommonPlugins } from "./common/plugins/index.js";
import healthRoutes from "./modules/health/health.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:standard",
              },
            }
          : undefined,
    },
  });

  await registerCommonPlugins(app);

  await app.register(healthRoutes);
  // Register additional feature modules here, e.g.:
  // await app.register(userRoutes, { prefix: "/users" });

  return app;
}
