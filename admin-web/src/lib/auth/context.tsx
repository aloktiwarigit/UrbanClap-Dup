'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminRole } from '@/lib/auth/types';

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
    await fetch('/api/v1/admin/auth/logout', { method: 'POST', credentials: 'include' });
    setAuth(null);
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
