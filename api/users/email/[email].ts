import { AzureFunction, Context, HttpRequest } from "@azure/functions";

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
    // Replace this with actual DB lookup logic
    const user = await fakeFindUserByEmail(email);

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

async function fakeFindUserByEmail(email: string) {
  // Mock user search — replace with your DB logic
  if (email === "test@example.com") {
    return { id: 1, email: "test@example.com", name: "Test User" };
  }
  return null;
}
