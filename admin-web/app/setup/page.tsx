'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/api/base';

export default function SetupPage() {
  const router = useRouter();
  const [setupToken, setSetupToken] = useState('');
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('setupToken') ?? '';
    sessionStorage.removeItem('setupToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    setSetupToken(token);

    fetch(apiUrl('/v1/admin/auth/setup-totp'), {
      headers: { authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d: { qrCodeDataUri?: string }) => {
        if (d.qrCodeDataUri) setQrUri(d.qrCodeDataUri);
        else router.replace('/login');
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/v1/admin/auth/setup-totp'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${setupToken}`,
        },
        body: JSON.stringify({ totpCode: code }),
        credentials: 'include',
      });
      const data = (await res.json()) as { code?: string };
      if (!res.ok) {
        setError(
          data.code === 'TOTP_INVALID'
            ? 'That Microsoft Authenticator code did not match. Try the next 6-digit code.'
            : 'Microsoft Authenticator setup failed. Sign in again.',
        );
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center bg-[var(--color-surface)] px-[var(--space-5)] py-[var(--space-8)] text-[var(--color-text)]">
      <section className="grid w-full max-w-[58rem] grid-cols-1 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-lg)] md:grid-cols-[1fr_1fr]">
        <aside className="border-b border-[var(--color-border)] bg-[var(--ink-1)] p-[var(--space-6)] md:border-b-0 md:border-r">
          <p className="eyebrow m-0">First admin sign-in</p>
          <h1 className="display m-0 mt-[var(--space-4)] text-[clamp(2rem,4vw,3.3rem)]">
            Set up Microsoft Authenticator
          </h1>
          <p className="m-0 mt-[var(--space-5)] max-w-[25rem] text-sm text-[var(--color-text-muted)]">
            Admin access requires a 6-digit code from Microsoft Authenticator after Google or password sign-in.
          </p>

          <ol className="mt-[var(--space-8)] grid gap-[var(--space-3)] pl-0 text-sm">
            {[
              'Open Microsoft Authenticator on your phone.',
              'Add an account and scan this QR code.',
              'Enter the 6-digit code shown for HomeHeroo admin.',
            ].map((item, index) => (
              <li key={item} className="grid grid-cols-[2rem_1fr] gap-[var(--space-3)]">
                <span className="grid h-8 w-8 place-items-center border border-[var(--marigold)] font-mono text-xs text-[var(--marigold-soft)]">
                  {index + 1}
                </span>
                <span className="pt-1 text-[var(--color-text-muted)]">{item}</span>
              </li>
            ))}
          </ol>
        </aside>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="grid content-start gap-[var(--space-5)] p-[var(--space-6)]"
          aria-label="Microsoft Authenticator setup"
        >
          <div className="grid gap-[var(--space-2)]">
            <p className="eyebrow m-0">Authenticator setup</p>
            <h2 className="m-0 text-[length:var(--text-2xl)] font-semibold">
              Scan the QR code
            </h2>
            <p className="m-0 text-sm text-[var(--color-text-muted)]">
              Use Microsoft Authenticator, not a Gmail or email OTP screen.
            </p>
          </div>

          <div className="grid place-items-center border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-5)]">
            {qrUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUri}
                alt="Microsoft Authenticator setup QR code"
                className="h-52 w-52 bg-white p-2"
              />
            ) : (
              <div className="h-52 w-52 animate-pulse bg-[var(--color-surface-raised)]" />
            )}
          </div>

          {error && (
            <p role="alert" className="alert alert-danger m-0">
              {error}
            </p>
          )}

          <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
            Microsoft Authenticator code
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoComplete="one-time-code"
              placeholder="6-digit code"
              className="min-h-12 text-center font-mono text-[length:var(--text-lg)] tracking-[0.18em]"
            />
          </label>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary min-h-12 w-full"
          >
            {loading ? 'Confirming...' : 'Confirm Microsoft Authenticator'}
          </button>
        </form>
      </section>
    </main>
  );
}
