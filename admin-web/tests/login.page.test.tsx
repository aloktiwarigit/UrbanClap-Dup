import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signInWithPopup } from 'firebase/auth';
import LoginPage from '../app/[locale]/login/page';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('@/lib/auth/firebase', () => ({ getFirebaseAuth: () => ({}) }));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({ setCustomParameters: vi.fn() })),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock, replace: replaceMock }) }));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/login');
  });

  it('renders identity sign-in with clear Microsoft Authenticator guidance', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: /secure operations access/i })).toBeDefined();
    expect(screen.getByText(/microsoft authenticator approves admin access/i)).toBeDefined();
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.queryByLabelText(/microsoft authenticator code/i)).toBeNull();
    expect(screen.getByRole('button', { name: /sign in with password/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeDefined();
  });

  it('restores a valid refresh session from the login redirect', async () => {
    window.history.replaceState({}, '', '/login?next=%2Forders');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    render(<LoginPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/admin-api/v1/admin/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      expect(replaceMock).toHaveBeenCalledWith('/orders');
    });
  });

  it('moves Google sign-in to a Microsoft Authenticator challenge when admin MFA is required', async () => {
    const getIdToken = vi.fn().mockResolvedValue('firebase-id-token');
    vi.mocked(signInWithPopup).mockResolvedValue({ user: { getIdToken } } as never);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              mfaRequired: true,
              challengeToken: 'mfa-challenge-token',
              email: 'admin@test.com',
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await screen.findByRole('heading', { level: 2, name: /open microsoft authenticator/i });
    expect(
      screen.getByText(/do not use a gmail email code/i),
    ).toBeDefined();
    expect(signInWithPopup).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(/microsoft authenticator code/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verify microsoft authenticator/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/dashboard'));
    const secondBody = JSON.parse(
      (vi.mocked(fetch).mock.calls[1]?.[1] as RequestInit).body as string,
    ) as { challengeToken: string; totpCode: string };
    expect(secondBody).toEqual({ challengeToken: 'mfa-challenge-token', totpCode: '123456' });
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
  });
});
