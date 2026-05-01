import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '../app/login/page';

vi.mock('@/lib/auth/firebase', () => ({ getFirebaseAuth: () => ({}) }));
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

describe('LoginPage', () => {
  it('renders email, password, and TOTP fields', () => {
    render(<LoginPage />);
    // Post-rebrand: the level-1 "Sign in to the field." lives in the brand-wall aside
    // which is `hidden lg:flex`; below the lg breakpoint (jsdom default) it is
    // display:none. The right-pane heading is the always-visible h2 "Sign in."
    expect(screen.getByRole('heading', { level: 2, name: /sign in/i })).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    // Anchor to exact "Password" — the Authenticator code field's hint mentions
    // "1Password" which would otherwise match a /password/i regex.
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByLabelText(/authenticator code/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
  });
});
