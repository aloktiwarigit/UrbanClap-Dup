'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/api/base';
import type { AdminRole } from '@/lib/auth/types';
import { getFirebaseAuth } from '@/lib/auth/firebase';
import { unregisterAdminPushToken } from '@/lib/push-registration';

export interface AuthState {
  adminId: string;
  email: string;
  role: AdminRole;
}

interface AdminAuthContextValue {
  auth: AuthState | null;
  setAuth: (auth: AuthState) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth: AuthState | null;
}) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(initialAuth);

  const logout = useCallback(async () => {
    // Best-effort: de-register FCM push token before invalidating the session.
    // Failures are swallowed so logout is never blocked.
    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await unregisterAdminPushToken(idToken);
      }
    } catch {
      // Intentionally ignored — push de-registration is best-effort.
    }
    await fetch(apiUrl('/v1/admin/auth/logout'), { method: 'POST', credentials: 'include' });
    setAuth(null);
    // Unprefixed '/login' is correct despite localePrefix: 'always'. The middleware resolves the
    // locale from the NEXT_LOCALE cookie when a path carries no prefix
    // (src/lib/i18n/helpers.ts:getLocaleFromRequest), and LocaleSwitcher sets that cookie — so a
    // Hindi admin lands on /hi/login. Prefixing it here by hand was tried and reverted: it adds an
    // i18n dependency to the auth provider for no behavioural gain.
    router.push('/login');
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
