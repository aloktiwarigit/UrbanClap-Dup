'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    if (!token) { router.replace('/login'); return; }
    setSetupToken(token);

    fetch('/api/v1/admin/auth/setup-totp', {
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
      const res = await fetch('/api/v1/admin/auth/setup-totp', {
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
        setError(data.code === 'TOTP_INVALID' ? 'Code incorrect. Try again.' : 'Enrollment failed.');
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
    <main className="min-h-[100dvh] flex items-center justify-center p-[var(--space-6)] bg-[var(--color-surface)]">
      <div className="w-full max-w-[26rem] flex flex-col gap-[var(--space-4)]">
        <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text)]">
          Set up two-factor authentication
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Scan this QR code with Google Authenticator (or any TOTP app), then enter the
          6-digit code below to confirm.
        </p>

        {qrUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUri} alt="TOTP QR code" className="w-48 h-48 mx-auto rounded" />
        ) : (
          <div className="w-48 h-48 mx-auto bg-[var(--color-surface-raised)] rounded animate-pulse" />
        )}

        {error && <p role="alert" className="text-sm text-[var(--color-error)]">{error}</p>}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-[var(--space-3)]">
          <label className="flex flex-col gap-1 text-sm text-[var(--color-text-muted)]">
            6-digit code from your app
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoComplete="one-time-code"
              className="px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            />
          </label>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="px-4 py-2 rounded bg-[var(--color-primary)] text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Confirming\u2026' : 'Confirm and sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
