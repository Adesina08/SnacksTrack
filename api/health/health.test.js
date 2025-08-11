import { jest } from '@jest/globals';

jest.unstable_mockModule('../db.js', () => ({
  dbReady: jest.fn().mockResolvedValue(true)
}));

describe('health', () => {
  it('should return a 200 status with ok true', async () => {
    const { default: health } = await import('./index.js');
    const context = { res: {}, log: { error: jest.fn() } };

    await health(context);

    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual({ ok: true });
  });

  it('should return 500 on error', async () => {
    jest.resetModules();
    jest.unstable_mockModule('../db.js', () => ({
      dbReady: jest.fn().mockRejectedValue(new Error('fail'))
    }));
    const { default: health } = await import('./index.js');
    const context = { res: {}, log: { error: jest.fn() } };

    await health(context);

    expect(context.res.status).toBe(500);
    expect(context.res.body).toEqual({ error: 'fail' });
  });
});
