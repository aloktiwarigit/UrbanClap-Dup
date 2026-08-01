'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/lib/auth/context';

/**
 * S-35 — the authenticated shell had no way to sign out.
 *
 * `logout` was fully implemented in `src/lib/auth/context.tsx` — it de-registers the FCM push token,
 * calls `/v1/admin/auth/logout`, clears local auth state and redirects — and provided through the
 * context at `:52`. No component ever called it. The console has shipped since without a sign-out
 * control, so the only way to end a session was to clear cookies.
 *
 * That matters beyond convenience: this console can refund customers, override orders and approve
 * payouts. A shared or borrowed machine had no way to drop those privileges.
 */
export function SignOutButton() {
  const t = useTranslations('auth');
  const { logout } = useAdminAuth();
  const [pending, setPending] = useState(false);

  async function handleSignOut(): Promise<void> {
    if (pending) return;
    setPending(true);
    try {
      await logout();
    } finally {
      // Reset even on success — the redirect may not have unmounted this yet, and leaving the
      // control permanently disabled would strand the user if logout failed.
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className="signout"
      // Guarded rather than merely styled-disabled: logout de-registers the push token and hits the
      // API, so a double-click would fire two de-registrations and two session invalidations.
      disabled={pending}
      aria-busy={pending || undefined}
      // `void handleSignOut()` rather than an async handler: ESLint's no-misused-promises rejects
      // passing a Promise-returning function where a void return is expected. Matches the existing
      // `onSubmit={(e) => void handleSubmit(e)}` pattern on the login and setup forms.
      onClick={() => void handleSignOut()}
    >
      {pending ? t('signingOut') : t('signOut')}
    </button>
  );
}
