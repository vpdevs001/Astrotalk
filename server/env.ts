import "dotenv/config";

import { z } from "zod";

const _env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().default(3000),
});

export const env = _env.parse(process.env);
