import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { AdminAuthProvider, type AuthState } from '@/lib/auth/context';

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
      {children}
    </AdminAuthProvider>
  );
}
