'use client';

import { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/api/base';
import { getFirebaseAuth } from '@/lib/auth/firebase';

type LoginMethod = 'password' | 'google';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoginMethod | null>(null);

  async function completeAdminLogin(idToken: string) {
    const res = await fetch(apiUrl('/v1/admin/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken, totpCode: totpCode || undefined }),
      credentials: 'include',
    });

    const data = (await res.json()) as {
      requiresSetup?: boolean;
      setupToken?: string;
      code?: string;
    };

    if (!res.ok) {
      setError(
        data.code === 'TOTP_INVALID'
          ? 'Invalid authenticator code. Please try again.'
          : data.code === 'TOTP_REQUIRED'
            ? 'Please enter your 6-digit authenticator code.'
            : 'Login failed. Check your credentials.',
      );
      return;
    }

    if (data.requiresSetup && data.setupToken) {
      sessionStorage.setItem('setupToken', data.setupToken);
      router.push('/setup');
      return;
    }

    router.push('/dashboard');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading('password');

    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();
      await completeAdminLogin(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Invalid email or password.'
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
      await completeAdminLogin(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was closed before it completed.'
          : code === 'auth/popup-blocked'
            ? 'Allow pop-ups for this admin site and try again.'
            : code === 'auth/account-exists-with-different-credential'
              ? 'This email uses a different sign-in method.'
              : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center p-[var(--space-6)] bg-[var(--color-surface-alt)] text-[var(--color-text)]">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-[27rem] grid gap-[var(--space-5)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-6)] shadow-[var(--shadow-lg)]"
        aria-label="Admin sign-in"
      >
        <div className="grid gap-[var(--space-2)]">
          <p className="text-[length:var(--text-sm)] font-semibold uppercase text-[var(--color-brand)]">
            HomeHeroo admin
          </p>
          <h1 className="m-0 text-[length:var(--text-3xl)] font-bold">
            Sign in to operations
          </h1>
          <p className="m-0 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
            Use your admin credentials and authenticator code to manage live bookings,
            payouts, and complaint recovery.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="m-0 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-danger)]"
          >
            {error}
          </p>
        )}

        <label className="grid gap-1 text-sm font-medium text-[var(--color-text)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-[var(--color-text)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-[var(--color-text)]">
          Authenticator code
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            autoComplete="one-time-code"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)]"
          />
        </label>

        <button
          type="submit"
          disabled={loading !== null}
          className="min-h-12 rounded-[var(--radius-md)] bg-[var(--color-brand)] px-4 py-2 font-semibold text-[var(--color-brand-fg)] shadow-[var(--shadow-md)] disabled:opacity-50"
        >
          {loading === 'password' ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase text-[var(--color-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <span>or</span>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={loading !== null}
          className="min-h-12 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-semibold text-[var(--color-text)] shadow-[var(--shadow-sm)] disabled:opacity-50"
        >
          {loading === 'google' ? 'Opening Google...' : 'Continue with Google'}
        </button>
      </form>
    </main>
  );
}
