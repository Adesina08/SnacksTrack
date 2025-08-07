import { jsonResponse } from '../shared.js';

export default async function (context, req) {
  context.res = jsonResponse(200, { status: 'ok' });
}
