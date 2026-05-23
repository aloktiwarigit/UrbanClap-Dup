export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { AdminAuthProvider, type AuthState } from '@/lib/auth/context';
import { Rail } from '@/components/dashboard/Rail';
import { Topbar } from '@/components/dashboard/Topbar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { normalizeAdminRole } from '@/admin/capabilities';
import { GrowthBookClientProvider } from '@/components/providers/GrowthBookClientProvider';
import { getValidatedJwtSecret } from '@/lib/env';
import { routing } from '@/i18n/config';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let jwtSecretStr: string;
  try {
    jwtSecretStr = getValidatedJwtSecret();
  } catch {
    throw new Error('JWT_SECRET env var is required');
  }
  const JWT_SECRET = new TextEncoder().encode(jwtSecretStr);

  const cookieStore = await cookies();
  const token = cookieStore.get('hs_access')?.value;

  let initialAuth: AuthState | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = normalizeAdminRole(payload['role']);
      if (!role) throw new Error('invalid role');
      initialAuth = {
        adminId: payload.sub as string,
        email: '',
        role,
      };
    } catch {
      redirect(`/${locale}/login`);
    }
  } else {
    redirect(`/${locale}/login`);
  }

  return (
    <GrowthBookClientProvider>
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
            <Topbar rightSlot={<><LocaleSwitcher /><ThemeToggle /></>} />
            <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
          </div>
        </div>
      </AdminAuthProvider>
    </GrowthBookClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
