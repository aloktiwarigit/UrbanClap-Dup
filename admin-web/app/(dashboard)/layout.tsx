export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { AdminAuthProvider, type AuthState } from '@/lib/auth/context';
import { Rail } from '@/components/dashboard/Rail';
import { Topbar } from '@/components/dashboard/Topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const jwtSecretEnv = process.env.JWT_SECRET;
  if (!jwtSecretEnv) throw new Error('JWT_SECRET env var is required');
  const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv);

  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value;

  let initialAuth: AuthState | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      initialAuth = {
        adminId: payload.sub as string,
        email: '',
        role: payload['role'] as AuthState['role'],
      };
    } catch {
      redirect('/login');
    }
  } else {
    redirect('/login');
  }

  return (
    <AdminAuthProvider initialAuth={initialAuth}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: 'var(--ink-0)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Rail />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar />
          <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
