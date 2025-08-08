import { render, screen, fireEvent } from '@testing-library/react';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('should toggle password visibility', () => {
    render(<PasswordInput />);
    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');

    const showButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(showButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideButton);

    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });
});
