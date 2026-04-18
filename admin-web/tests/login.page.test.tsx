import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginStubPage from '../app/login/page';

describe('LoginStubPage', () => {
  it('renders the 501 placeholder copy', () => {
    render(<LoginStubPage />);
    expect(screen.getByRole('heading', { level: 1, name: /501/ })).toBeDefined();
    expect(screen.getByText(/replaced by the real owner-auth flow/)).toBeDefined();
  });
});
