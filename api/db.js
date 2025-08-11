import pkg from "pg";
const { Pool } = pkg;

// Optional: dotenv for local dev only (no-op in prod)
if (process.env.AZURE_FUNCTIONS_ENVIRONMENT !== "Production") {
  try { await import("dotenv/config"); } catch {}
}

export const pool = new Pool({
  host: process.env.DB_HOST,                        // ooh-app1.postgres.database.azure.com
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,                        // iniotech@ooh-app1
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

// Optional: readiness helper
export async function dbReady() {
  const c = await pool.connect(); c.release();
  return true;
}
