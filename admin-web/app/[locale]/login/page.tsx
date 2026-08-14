'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import { apiUrl } from '@/api/base';
import { getFirebaseAuth } from '@/lib/auth/firebase';
import { getSafeNextPath } from '@/lib/auth/safe-next-path';
import { registerAdminPushToken } from '@/lib/push-registration';
import { routing } from '@/i18n/config';
import type { AdminRole } from '@/lib/auth/types';

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

type LoginErrorTranslator = (key: string) => string;

function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getSafeNextPathFromUrl(role: AdminRole): string {
  if (typeof window === 'undefined') return getSafeNextPath(null, role);
  const next = new URLSearchParams(window.location.search).get('next');
  return getSafeNextPath(next, role);
}

function routeTo(path: string): Parameters<ReturnType<typeof useRouter>['push']>[0] {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- typedRoutes:true makes RouteImpl<unknown> non-assignable from string; cast is load-bearing
  return path as Parameters<ReturnType<typeof useRouter>['push']>[0];
}

function withLocalePrefix(path: string, locale: string): string {
  if (routing.locales.some((value) => path === `/${value}` || path.startsWith(`/${value}/`))) {
    return path;
  }
  return `/${locale}${path}`;
}

function normalizeLoginError(code: string | undefined, t: LoginErrorTranslator): string {
  switch (code) {
    case 'ADMIN_NOT_FOUND':
      return t('adminNotFound');
    case 'FIREBASE_TOKEN_INVALID':
      return t('firebaseTokenInvalid');
    case 'MFA_CHALLENGE_INVALID':
      return t('mfaChallengeInvalid');
    case 'TOTP_INVALID':
      return t('totpInvalid');
    case 'TOTP_NOT_CONFIGURED':
    case 'TOTP_NOT_ENROLLED':
      return t('totpNotConfigured');
    default:
      return t('fallback');
  }
}

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? routing.defaultLocale;
  const t = useTranslations('login');
  const tErr = useTranslations('login.errors');
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
          router.replace(routeTo(withLocalePrefix(getSafeNextPathFromUrl('super-admin'), locale)));
        }
      } catch {
        // Stay on the login form when no valid refresh session is available.
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  // Handle returning from mobile Google sign-in redirect.
  useEffect(() => {
    let cancelled = false;
    async function handleGoogleRedirectResult() {
      try {
        const result = await getRedirectResult(getFirebaseAuth());
        if (!result || cancelled) return;
        setLoading('google');
        const idToken = await result.user.getIdToken();
        const data = await postAdminLogin({ idToken });
        // Best-effort push registration — must not block or throw into the auth flow.
        void registerAdminPushToken(idToken);
        if (!cancelled) handleLoginResponse(data, 'google');
      } catch (err: unknown) {
        if (cancelled) return;
        const code = (err as { code?: string })?.code ?? '';
        setError(
          code === 'auth/account-exists-with-different-credential'
            ? tErr('googleAccountExists')
            : err instanceof Error
              ? err.message
              : tErr('googleFallback'),
        );
      } finally {
        if (!cancelled) setLoading(null);
      }
    }
    void handleGoogleRedirectResult();

    // Mobile browsers frequently restore this page from the back-forward cache
    // when Google redirects back after sign-in, instead of doing a fresh
    // navigation. A bfcache restore does not re-run this effect, so without this
    // listener getRedirectResult() would only ever have been called before the
    // redirect completed (resolving null) and the finished sign-in would be
    // silently lost. `pageshow` with `persisted: true` is the only signal for
    // a bfcache restore, so re-run the check when it fires.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) void handleGoogleRedirectResult();
    }
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener('pageshow', handlePageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function postAdminLogin(body: Record<string, string | undefined>): Promise<LoginResponse> {
    const res = await fetch(apiUrl('/v1/admin/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = (await res.json()) as LoginResponse;
    if (!res.ok) {
      throw Object.assign(new Error(normalizeLoginError(data.code, tErr)), { code: data.code });
    }
    return data;
  }

  function handleLoginResponse(data: LoginResponse, method: MfaChallenge['method']) {
    if (data.requiresSetup) {
      // setupToken is now delivered as an HttpOnly `hs_setup` cookie by the API
      // server. The client must not write it to sessionStorage. Navigate directly
      // to /setup and let the exchange endpoint bridge the cookie → token.
      router.push(routeTo(`/${locale}/setup`));
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
    const role = (data.role ?? 'super-admin') as AdminRole;
    router.push(routeTo(withLocalePrefix(getSafeNextPathFromUrl(role), locale)));
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading('password');

    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const idToken = await credential.user.getIdToken();
      const data = await postAdminLogin({ idToken });
      // Best-effort push registration — must not block or throw into the auth flow.
      void registerAdminPushToken(idToken);
      handleLoginResponse(data, 'password');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? tErr('invalidCredential')
          : err instanceof Error
            ? err.message
            : tErr('genericPassword'),
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading('google');

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (isMobileBrowser()) {
      // Mobile browsers block popups. Use redirect flow instead — the page
      // navigates to Google and returns; getRedirectResult() handles the result.
      try {
        await signInWithRedirect(getFirebaseAuth(), provider);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : tErr('googleFallback'));
        setLoading(null);
      }
      return;
    }

    try {
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await credential.user.getIdToken();
      const data = await postAdminLogin({ idToken });
      // Best-effort push registration — must not block or throw into the auth flow.
      void registerAdminPushToken(idToken);
      handleLoginResponse(data, 'google');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(
        code === 'auth/popup-closed-by-user'
          ? tErr('googlePopupClosed')
          : code === 'auth/popup-blocked'
            ? tErr('googlePopupBlocked')
            : code === 'auth/account-exists-with-different-credential'
              ? tErr('googleAccountExists')
              : err instanceof Error
                ? err.message
                : tErr('googleFallback'),
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
      // Best-effort push registration — must not block or throw into the MFA flow.
      // Obtain the idToken from the still-authenticated Firebase user (the Firebase
      // session persists after the MFA challenge exchange) before router.push fires.
      try {
        const user = getFirebaseAuth().currentUser;
        if (user) {
          const idToken = await user.getIdToken();
          void registerAdminPushToken(idToken);
        }
      } catch {
        // Intentionally swallowed — push registration is best-effort.
      }
      handleLoginResponse(data, challenge.method);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tErr('mfaVerificationFallback'));
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
          <p className="eyebrow m-0">{t('brand.eyebrow')}</p>
          <h1 className="display m-0 mt-[var(--space-4)] text-[clamp(2rem,4vw,3.5rem)]">
            {t('hero.title')}
          </h1>
          <p className="m-0 mt-[var(--space-5)] max-w-[26rem] text-sm text-[var(--color-text-muted)]">
            {t('hero.subtitle')}
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
                <p className="m-0 font-semibold text-[var(--color-text)]">{t('steps.one.title')}</p>
                <p className="m-0 text-xs text-[var(--color-text-muted)]">
                  {t('steps.one.description')}
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
                <p className="m-0 font-semibold text-[var(--color-text)]">{t('steps.two.title')}</p>
                <p className="m-0 text-xs text-[var(--color-text-muted)]">
                  {t('steps.two.description')}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <form
          onSubmit={(e) => void (challenge ? handleMfaSubmit(e) : handlePasswordSubmit(e))}
          className="grid gap-[var(--space-5)] p-[var(--space-6)]"
          aria-label={t('form.ariaLabel')}
        >
          <div className="grid gap-[var(--space-2)]">
            <p className="eyebrow m-0">
              {isMfaStep ? t('form.eyebrow.mfa') : t('form.eyebrow.signIn')}
            </p>
            <h2 className="m-0 text-[length:var(--text-2xl)] font-semibold">
              {isMfaStep ? t('form.heading.mfa') : t('form.heading.signIn')}
            </h2>
            <p className="m-0 text-sm text-[var(--color-text-muted)]">
              {isMfaStep ? t('form.description.mfa') : t('form.description.signIn')}
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
                  {t('form.identityCard.label')}
                </p>
                <p className="m-0 mt-1 break-all text-sm font-semibold text-[var(--color-text)]">
                  {challenge.email || t('form.identityCard.fallback')}
                </p>
              </div>

              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                {t('form.mfa.codeLabel')}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('form.mfa.codePlaceholder')}
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
                {loading === 'mfa' ? t('form.mfa.verifyingButton') : t('form.mfa.verifyButton')}
              </button>

              <button
                type="button"
                onClick={resetChallenge}
                disabled={loading !== null}
                className="btn btn-ghost min-h-12 w-full"
              >
                {t('form.mfa.switchMethodButton')}
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
                {loading === 'google'
                  ? t('form.google.openingButton')
                  : t('form.google.continueButton')}
              </button>

              <div className="flex items-center gap-3 text-xs uppercase text-[var(--color-text-muted)]">
                <span className="h-px flex-1 bg-[var(--color-border)]" />
                <span>{t('form.divider')}</span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </div>

              <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                {t('form.emailLabel')}
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
                {t('form.passwordLabel')}
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
                {loading === 'password'
                  ? t('form.password.submittingButton')
                  : t('form.password.submitButton')}
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}
