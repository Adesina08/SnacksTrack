import { jest } from '@jest/globals';

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

describe('getLeaderboard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the leaderboard', async () => {
    const { pool } = await import('../db.js');
    const { default: getLeaderboard } = await import('./index.js');

    const context = {
      res: {},
      log: jest.fn(),
    };

    const mockLeaderboard = [
      { id: '1', name: 'John Doe', points: 100 },
      { id: '2', name: 'Jane Smith', points: 90 },
    ];
    pool.query.mockResolvedValue({ rows: mockLeaderboard });

    await getLeaderboard(context, {});

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, first_name || ' ' || last_name AS name, points FROM users WHERE email <> 'admin@inicio-insights.com' ORDER BY points DESC"
    );
    expect(context.res.status).toBe(200);
    expect(JSON.parse(context.res.body)).toEqual(mockLeaderboard);
  });

  it('should handle errors', async () => {
    const { pool } = await import('../db.js');
    const { default: getLeaderboard } = await import('./index.js');

    const context = {
      res: {},
      log: jest.fn(),
    };

    const error = new Error('DB error');
    pool.query.mockRejectedValue(error);

    await getLeaderboard(context, {});

    expect(context.res.status).toBe(500);
    expect(JSON.parse(context.res.body)).toEqual({ message: 'Error getting leaderboard' });
    expect(context.log).toHaveBeenCalledWith(error);
  });
});
