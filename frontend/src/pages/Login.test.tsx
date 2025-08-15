import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/api-client', () => ({
  localDbOperations: {
    getUserByEmail: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  authUtils: {
    verifyPassword: vi.fn(),
    generateToken: vi.fn(),
    setAuthToken: vi.fn(),
    isAdminUser: vi.fn(),
    cacheUser: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
    NotificationService: {
        requestPermission: vi.fn(),
        savePreferences: vi.fn(),
        loadPreferences: vi.fn(),
    }
}));


describe('Login page', () => {
  it('should allow a user to log in successfully', async () => {
    const { localDbOperations } = await import('@/lib/api-client');
    const { authUtils } = await import('@/lib/auth');
    const { toast } = await import('@/hooks/use-toast');

    const mockUser = {
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
    };
    localDbOperations.getUserByEmail.mockResolvedValue(mockUser);
    authUtils.verifyPassword.mockResolvedValue(true);
    authUtils.generateToken.mockResolvedValue('fake-token');
    authUtils.isAdminUser.mockReturnValue(false);


    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Need to wait for the async operations to complete
    await vi.waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
            title: 'Welcome back!',
            description: 'You have successfully logged in to SnackTrack.',
        });
    });

    expect(localDbOperations.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(authUtils.verifyPassword).toHaveBeenCalledWith('password', 'hashedpassword');
    expect(authUtils.generateToken).toHaveBeenCalledWith(mockUser);
    expect(authUtils.setAuthToken).toHaveBeenCalledWith('fake-token');
    expect(authUtils.cacheUser).toHaveBeenCalledWith(mockUser);
  });
});
