import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { createConnection } from "pg"; // or use `pg` for Postgres

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const email = context.bindingData.email;

  if (!email) {
    context.res = {
      status: 400,
      body: "Email is required",
    };
    return;
  }

  try {
    const connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute("SELECT * FROM users WHERE email = ?", [email]);
    await connection.end();

    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

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
  }
};

export default httpTrigger;
