import { dbReady } from "../db.js";

export default async function (context) {
  try {
    await dbReady();
    context.res = { status: 200, headers: { "content-type": "application/json" }, body: { ok: true } };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, headers: { "content-type": "application/json" }, body: { error: err.message } };
  }
}
