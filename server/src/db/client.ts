import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../common/config/env.js";
import * as schema from "./schema.js";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

/**
 * Quick connectivity check — used by the /health route so a DB outage
 * shows up there instead of surfacing as a confusing 500 on first query.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
