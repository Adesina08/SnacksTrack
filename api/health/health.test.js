import { jest } from '@jest/globals';

// Mock the shared.js module
jest.unstable_mockModule('../shared.js', () => ({
  jsonResponse: (status, body) => ({
    status,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  }),
}));

describe('health', () => {
  it('should return a 200 status with an ok message', async () => {
    const { default: health } = await import('./index.js');
    const context = { res: {} };
    const req = {};

    await health(context, req);

    expect(context.res.status).toBe(200);
    const responseBody = JSON.parse(context.res.body);
    expect(responseBody.status).toBe('ok');
  });
});
