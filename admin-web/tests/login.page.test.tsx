import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getRedirectResult, signInWithPopup } from 'firebase/auth';
import LoginPage from '../app/[locale]/login/page';

const pushMock = vi.fn();
const replaceMock = vi.fn();

const LOGIN_EN: Record<string, string> = {
  'brand.eyebrow': 'HomeHeroo admin',
  'hero.title': 'Secure operations access',
  'hero.subtitle':
    'Google or password proves identity. Microsoft Authenticator approves admin access.',
  'steps.one.title': 'Verify identity',
  'steps.one.description': 'Continue with Google or admin email and password.',
  'steps.two.title': 'Approve with Microsoft Authenticator',
  'steps.two.description':
    'Use the 6-digit code for HomeHeroo admin. It is not a Gmail OTP.',
  'form.ariaLabel': 'Admin sign-in',
  'form.eyebrow.signIn': 'Step 1 of 2',
  'form.eyebrow.mfa': 'Step 2 of 2',
  'form.heading.signIn': 'Choose how to sign in',
  'form.heading.mfa': 'Open Microsoft Authenticator',
  'form.description.signIn':
    'Start with Google sign-in or admin email and password. The Microsoft Authenticator step appears next.',
  'form.description.mfa':
    'Enter the 6-digit code shown for HomeHeroo admin. Do not use a Gmail email code.',
  'form.identityCard.label': 'Signed in identity',
  'form.identityCard.fallback': 'Verified admin',
  'form.mfa.codeLabel': 'Microsoft Authenticator code',
  'form.mfa.codePlaceholder': '6-digit code',
  'form.mfa.verifyingButton': 'Verifying…',
  'form.mfa.verifyButton': 'Verify Microsoft Authenticator',
  'form.mfa.switchMethodButton': 'Use a different sign-in',
  'form.google.openingButton': 'Opening Google…',
  'form.google.continueButton': 'Continue with Google',
  'form.divider': 'or use admin password',
  'form.emailLabel': 'Email address',
  'form.passwordLabel': 'Password',
  'form.password.submittingButton': 'Signing in…',
  'form.password.submitButton': 'Sign in with password',
};

const LOGIN_ERR_EN: Record<string, string> = {
  adminNotFound: 'This Google account or email address is not an active admin user.',
  firebaseTokenInvalid: 'Google could not verify this sign-in. Try again.',
  mfaChallengeInvalid: 'The Microsoft Authenticator step expired. Sign in again.',
  totpInvalid:
    'That Microsoft Authenticator code did not match. Try the next 6-digit code.',
  totpNotConfigured:
    'Microsoft Authenticator is not set up for this admin user. Sign in again to finish setup.',
  fallback: 'Login failed. Check your credentials and try again.',
  invalidCredential: 'Invalid email or password.',
  genericPassword: 'An error occurred. Please try again.',
  googlePopupClosed: 'Google sign-in was closed before it completed.',
  googlePopupBlocked: 'Allow pop-ups for this admin site and try again.',
  googleAccountExists: 'This email uses a different sign-in method.',
  googleFallback: 'Google sign-in failed. Please try again.',
  mfaVerificationFallback: 'Verification failed. Try again.',
};

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => {
    if (ns === 'login') return LOGIN_EN[key] ?? key;
    if (ns === 'login.errors') return LOGIN_ERR_EN[key] ?? key;
    return key;
  },
  useLocale: () => 'hi',
}));

vi.mock('@/lib/auth/firebase', () => ({ getFirebaseAuth: () => ({}) }));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(() => ({ setCustomParameters: vi.fn() })),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn().mockResolvedValue(null),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useParams: () => ({ locale: 'hi' }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    vi.mocked(getRedirectResult).mockReset().mockResolvedValue(null);
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
      expect(replaceMock).toHaveBeenCalledWith('/hi/orders');
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

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/hi/dashboard'));
    const secondBody = JSON.parse(
      (vi.mocked(fetch).mock.calls[1]?.[1] as RequestInit).body as string,
    ) as { challengeToken: string; totpCode: string };
    expect(secondBody).toEqual({ challengeToken: 'mfa-challenge-token', totpCode: '123456' });
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('re-checks the Google redirect result when the page is restored from the back-forward cache', async () => {
    // Mobile browsers often restore this page from bfcache when Google redirects
    // back after sign-in, instead of a fresh navigation — the mount effect's
    // getRedirectResult() call (below, resolving null) never re-runs in that case.
    const getIdToken = vi.fn().mockResolvedValue('firebase-id-token');
    vi.mocked(getRedirectResult)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ user: { getIdToken } } as never);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ adminId: 'admin-1', role: 'super-admin', email: 'admin@test.com' }),
            { status: 200 },
          ),
        ),
    );

    render(<LoginPage />);

    await waitFor(() => expect(getRedirectResult).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();

    const pageshowEvent = new Event('pageshow');
    Object.defineProperty(pageshowEvent, 'persisted', { value: true });
    window.dispatchEvent(pageshowEvent);

    await waitFor(() => expect(getRedirectResult).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/hi/dashboard'));
  });

  it('does not re-check the redirect result on a normal (non-bfcache) pageshow', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(getRedirectResult).toHaveBeenCalledTimes(1));

    const pageshowEvent = new Event('pageshow');
    Object.defineProperty(pageshowEvent, 'persisted', { value: false });
    window.dispatchEvent(pageshowEvent);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getRedirectResult).toHaveBeenCalledTimes(1);
  });
});
