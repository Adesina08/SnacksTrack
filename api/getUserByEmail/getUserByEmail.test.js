import { jest } from '@jest/globals';

jest.unstable_mockModule('../db.js', () => ({
  pool: {
    query: jest.fn(),
  },
  dbReady: true,
}));

jest.unstable_mockModule('../shared.js', () => ({
  jsonResponse: (status, body) => ({
    status,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  }),
}));

describe('getUserByEmail', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a user when found', async () => {
    const { pool } = await import('../db.js');
    const { default: getUserByEmail } = await import('./index.js');

    const req = { params: { email: 'test@example.com' } };
    const context = { res: {}, log: jest.fn() };
    const mockUser = { id: '1', email: 'test@example.com' };
    pool.query.mockResolvedValue({ rows: [mockUser] });

    await getUserByEmail(context, req);

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email=$1', ['test@example.com']);
    expect(context.res.status).toBe(200);
    expect(JSON.parse(context.res.body)).toEqual(mockUser);
  });

  it('should return 404 when user not found', async () => {
    const { pool } = await import('../db.js');
    const { default: getUserByEmail } = await import('./index.js');

    const req = { params: { email: 'notfound@example.com' } };
    const context = { res: {}, log: jest.fn() };
    pool.query.mockResolvedValue({ rows: [] });

    await getUserByEmail(context, req);

    expect(context.res.status).toBe(404);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'User not found' });
  });

  it('should return 400 if email is not provided', async () => {
    const { default: getUserByEmail } = await import('./index.js');
    const req = { params: {} };
    const context = { res: {}, log: jest.fn() };

    await getUserByEmail(context, req);

    expect(context.res.status).toBe(400);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'Email parameter is required' });
  });

  it('should return 500 on database error', async () => {
    const { pool } = await import('../db.js');
    const { default: getUserByEmail } = await import('./index.js');

    const req = { params: { email: 'error@example.com' } };
    const context = { res: {}, log: jest.fn() };
    const error = new Error('DB Error');
    pool.query.mockRejectedValue(error);

    await getUserByEmail(context, req);

    expect(context.res.status).toBe(500);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'Error retrieving user' });
    expect(context.log).toHaveBeenCalledWith(error);
  });

  it('should return 503 if database is not ready', async () => {
    jest.resetModules();
    jest.unstable_mockModule('../db.js', () => ({
        pool: {
          query: jest.fn(),
        },
        dbReady: false,
      }));
    const { default: getUserByEmail } = await import('./index.js');
    const req = { params: { email: 'test@example.com' } };
    const context = { res: {}, log: jest.fn() };

    await getUserByEmail(context, req);

    expect(context.res.status).toBe(503);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'Service Unavailable' });
  });
});
