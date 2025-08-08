import { jest } from '@jest/globals';
import crypto from 'node:crypto';

jest.unstable_mockModule('../db.js', () => ({
  pool: {
    query: jest.fn(),
  },
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

describe('createUser', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user and return it', async () => {
    const { pool } = await import('../db.js');
    const { default: createUser } = await import('./index.js');

    const req = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        passwordHash: 'hashedpassword',
      },
    };
    const context = {
      res: {},
      log: jest.fn(),
    };

    const mockUser = { id: 'some-uuid', ...req.body };
    pool.query.mockResolvedValue({ rows: [mockUser] });

    // Mock crypto.randomUUID
    const spy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('some-uuid');

    await createUser(context, req);

    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO users(id,email,first_name,last_name,phone,password_hash) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        'some-uuid',
        'john.doe@example.com',
        'John',
        'Doe',
        '1234567890',
        'hashedpassword',
      ]
    );

    expect(context.res.status).toBe(200);
    expect(JSON.parse(context.res.body)).toEqual(mockUser);
    spy.mockRestore();
  });

  it('should handle errors during user creation', async () => {
    const { pool } = await import('../db.js');
    const { default: createUser } = await import('./index.js');

    const req = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        passwordHash: 'hashedpassword',
      },
    };
    const context = {
      res: {},
      log: jest.fn(),
    };

    const error = new Error('DB error');
    pool.query.mockRejectedValue(error);
    const spy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('some-uuid');

    await createUser(context, req);

    expect(context.res.status).toBe(500);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'Error creating user' });
    expect(context.log).toHaveBeenCalledWith(error);
    spy.mockRestore();
  });
});
