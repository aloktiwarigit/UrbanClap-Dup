'use client';

import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/api/base';
import { getFirebaseAuth } from '@/lib/auth/firebase';

type LoginMethod = 'password' | 'google' | 'mfa';

type LoginResponse = {
  adminId?: string;
  role?: string;
  email?: string;
  requiresSetup?: boolean;
  setupToken?: string;
  mfaRequired?: boolean;
  challengeToken?: string;
  expiresInSeconds?: number;
  code?: string;
};

type MfaChallenge = {
  token: string;
  email: string;
  method: 'google' | 'password';
};

function getSafeNextPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  return next;
}

function routeTo(path: string): Parameters<ReturnType<typeof useRouter>['push']>[0] {
  return path;
}

function normalizeLoginError(code: string | undefined): string {
  switch (code) {
    case 'ADMIN_NOT_FOUND':
      return 'This Google account or email address is not an active admin user.';
    case 'FIREBASE_TOKEN_INVALID':
      return 'Google could not verify this sign-in. Try again.';
    case 'MFA_CHALLENGE_INVALID':
      return 'The Microsoft Authenticator step expired. Sign in again.';
    case 'TOTP_INVALID':
      return 'That Microsoft Authenticator code did not match. Try the next 6-digit code.';
    case 'TOTP_NOT_CONFIGURED':
    case 'TOTP_NOT_ENROLLED':
      return 'Microsoft Authenticator is not set up for this admin user. Sign in again to finish setup.';
    default:
      return 'Login failed. Check your credentials and try again.';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoginMethod | null>(null);

  const isMfaStep = challenge !== null;

  useEffect(() => {
    if (!window.location.search.includes('next=')) return;

    let cancelled = false;
    async function restoreSession() {
      try {
        const res = await fetch(apiUrl('/v1/admin/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
        });
        if (!cancelled && res.ok) {
          router.replace(routeTo(getSafeNextPath()));
        }
      } catch {
        // Stay on the login form when no valid refresh session is available.
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function postAdminLogin(body: Record<string, string | undefined>): Promise<LoginResponse> {
    const res = await fetch(apiUrl('/v1/admin/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = (await res.json()) as LoginResponse;
    if (!res.ok) {
      throw Object.assign(new Error(normalizeLoginError(data.code)), { code: data.code });
    }
    return data;
  }

  function handleLoginResponse(data: LoginResponse, method: MfaChallenge['method']) {
    if (data.requiresSetup && data.setupToken) {
      sessionStorage.setItem('setupToken', data.setupToken);
      router.push('/setup');
      return;
    }

    if (data.mfaRequired && data.challengeToken) {
      setChallenge({
        token: data.challengeToken,
        email: data.email ?? email,
        method,
      });
      setMfaCode('');
      setError(null);
      return;
    }

    setChallenge(null);
    router.push(routeTo(getSafeNextPath()));
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading('password');

    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();
      const data = await postAdminLogin({ idToken });
      handleLoginResponse(data, 'password');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : err instanceof Error
            ? err.message
            : 'An error occurred. Please try again.',
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading('google');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await credential.user.getIdToken();
      const data = await postAdminLogin({ idToken });
      handleLoginResponse(data, 'google');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was closed before it completed.'
          : code === 'auth/popup-blocked'
            ? 'Allow pop-ups for this admin site and try again.'
            : code === 'auth/account-exists-with-different-credential'
              ? 'This email uses a different sign-in method.'
              : err instanceof Error
                ? err.message
                : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;

    setError(null);
    setLoading('mfa');
    try {
      const data = await postAdminLogin({
        challengeToken: challenge.token,
        totpCode: mfaCode,
      });
      handleLoginResponse(data, challenge.method);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Try again.');
    } finally {
      setLoading(null);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setMfaCode('');
    setError(null);
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-[var(--color-surface)] px-[var(--space-5)] py-[var(--space-8)] text-[var(--color-text)]">
      <section className="grid w-full max-w-[64rem] grid-cols-1 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-lg)] md:grid-cols-[0.9fr_1.1fr]">
        <aside className="border-b border-[var(--color-border)] bg-[var(--ink-1)] p-[var(--space-6)] md:border-b-0 md:border-r">
          <p className="eyebrow m-0">HomeHeroo admin</p>
          <h1 className="display m-0 mt-[var(--space-4)] text-[clamp(2rem,4vw,3.5rem)]">
            Secure operations access
          </h1>
          <p className="m-0 mt-[var(--space-5)] max-w-[26rem] text-sm text-[var(--color-text-muted)]">
            Google or password proves identity. Microsoft Authenticator approves admin access.
          </p>

          <div className="mt-[var(--space-8)] grid gap-[var(--space-3)] text-sm">
            <div
              className="grid grid-cols-[2rem_1fr] gap-[var(--space-3)]"
              aria-current={!isMfaStep ? 'step' : undefined}
            >
              <span className="grid h-8 w-8 place-items-center border border-[var(--marigold)] font-mono text-xs text-[var(--marigold-soft)]">
                1
              </span>
              <div>
                <p className="m-0 font-semibold text-[var(--color-text)]">Verify identity</p>
                <p className="m-0 text-xs text-[var(--color-text-muted)]">
                  Continue with Google or admin email and password.
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-[2rem_1fr] gap-[var(--space-3)] opacity-90"
              aria-current={isMfaStep ? 'step' : undefined}
            >
              <span className="grid h-8 w-8 place-items-center border border-[var(--color-border-strong)] font-mono text-xs text-[var(--color-text-muted)]">
                2
              </span>
              <div>
                <p className="m-0 font-semibold text-[var(--color-text)]">Approve with Microsoft Authenticator</p>
                <p className="m-0 text-xs text-[var(--color-text-muted)]">
                  Use the 6-digit code for HomeHeroo admin. It is not a Gmail OTP.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <form
          onSubmit={(e) => void (challenge ? handleMfaSubmit(e) : handlePasswordSubmit(e))}
          className="grid gap-[var(--space-5)] p-[var(--space-6)]"
          aria-label="Admin sign-in"
        >
          <div className="grid gap-[var(--space-2)]">
            <p className="eyebrow m-0">{isMfaStep ? 'Step 2 of 2' : 'Step 1 of 2'}</p>
            <h2 className="m-0 text-[length:var(--text-2xl)] font-semibold">
              {isMfaStep ? 'Open Microsoft Authenticator' : 'Choose how to sign in'}
            </h2>
            <p className="m-0 text-sm text-[var(--color-text-muted)]">
              {isMfaStep
                ? 'Enter the 6-digit code shown for HomeHeroo admin. Do not use a Gmail email code.'
                : 'Start with Google sign-in or admin email and password. The Microsoft Authenticator step appears next.'}
            </p>
          </div>

          {error && (
            <p role="alert" className="alert alert-danger m-0">
              {error}
            </p>
          )}

          {isMfaStep ? (
            <>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-4)]">
                <p className="m-0 text-xs uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
                  Signed in identity
                </p>
                <p className="m-0 mt-1 break-all text-sm font-semibold text-[var(--color-text)]">
                  {challenge.email || 'Verified admin'}
                </p>
              </div>

              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                Microsoft Authenticator code
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                  required
                  className="min-h-12 text-center font-mono text-[length:var(--text-lg)] tracking-[0.18em]"
                />
              </label>

              <button
                type="submit"
                disabled={loading !== null || mfaCode.length !== 6}
                className="btn btn-primary min-h-12 w-full"
              >
                {loading === 'mfa' ? 'Verifying...' : 'Verify Microsoft Authenticator'}
              </button>

              <button
                type="button"
                onClick={resetChallenge}
                disabled={loading !== null}
                className="btn btn-ghost min-h-12 w-full"
              >
                Use a different sign-in
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={loading !== null}
                className="btn btn-primary min-h-12 w-full"
              >
                {loading === 'google' ? 'Opening Google...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 text-xs uppercase text-[var(--color-text-muted)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                <span>or use admin password</span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="min-h-12"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="min-h-12"
                />
              </label>

              <button
                type="submit"
                disabled={loading !== null}
                className="btn btn-ghost min-h-12 w-full"
              >
                {loading === 'password' ? 'Signing in...' : 'Sign in with password'}
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
