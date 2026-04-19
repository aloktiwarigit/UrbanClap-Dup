'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/lib/auth/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch('/api/v1/admin/auth/login', {
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
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : 'An error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-[var(--space-6)] bg-[var(--color-surface)]">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-[24rem] flex flex-col gap-[var(--space-4)]"
        aria-label="Admin sign-in"
      >
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          Sign in
        </h1>

        {error && (
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
          Authenticator code
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code (required after first setup)"
            autoComplete="one-time-code"
            className="px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-[var(--color-primary)] text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
