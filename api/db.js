// /api/db.js  (ESM)
import pg from "pg";
const { Pool } = pg;

function makePool() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const needSSL =
      /sslmode=require/i.test(url) ||
      String(process.env.DB_SSL || "true").toLowerCase() !== "false";
    return new Pool({
      connectionString: url,
      ssl: needSSL ? { rejectUnauthorized: false } : false,
      max: Number(process.env.DB_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
    });
  }

  const needSSL = String(process.env.DB_SSL || "true").toLowerCase() !== "false";
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: needSSL ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
  });
}

export const pool = makePool();

export async function dbReady() {
  await pool.query("select 1");
  return true;
}
