import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Pool } from "pg";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const email = context.bindingData.email;

  if (!email) {
    context.res = {
      status: 400,
      body: "Email is required",
    };
    return;
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = rows.length > 0 ? rows[0] : null;

    if (!user) {
      context.res = {
        status: 404,
        body: "User not found",
      };
      return;
    }

    context.res = {
      status: 200,
      body: user,
    };
  } catch (error) {
    context.log.error("Failed to fetch user:", error);
    context.res = {
      status: 500,
      body: "Internal Server Error",
    };
  } finally {
    await pool.end();
  }
};

export default httpTrigger;
