import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '../src/lib/auth/context';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function Consumer() {
  const { auth } = useAdminAuth();
  return <span data-testid="role">{auth?.role ?? 'none'}</span>;
}

describe('AdminAuthProvider', () => {
  it('provides initialAuth to consumers', () => {
    render(
      <AdminAuthProvider initialAuth={{ adminId: 'u1', email: 'a@b.com', role: 'super-admin' }}>
        <Consumer />
      </AdminAuthProvider>,
    );
    expect(screen.getByTestId('role').textContent).toBe('super-admin');
  });

  it('provides null auth when no initialAuth', () => {
    render(
      <AdminAuthProvider initialAuth={null}>
        <Consumer />
      </AdminAuthProvider>,
    );
    expect(screen.getByTestId('role').textContent).toBe('none');
  });

  it('useAdminAuth throws outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Consumer />)).toThrow('useAdminAuth must be used inside AdminAuthProvider');
    spy.mockRestore();
  });

  it('logout calls /api/v1/admin/auth/logout and clears auth', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    function LogoutTrigger() {
      const { auth, logout } = useAdminAuth();
      return (
        <>
          <span data-testid="role">{auth?.role ?? 'none'}</span>
          <button onClick={() => void logout()}>logout</button>
        </>
      );
    }
    render(
      <AdminAuthProvider initialAuth={{ adminId: 'u1', email: 'a@b.com', role: 'ops-manager' }}>
        <LogoutTrigger />
      </AdminAuthProvider>,
    );
    expect(screen.getByTestId('role').textContent).toBe('ops-manager');
    await act(() => {
      screen.getByRole('button', { name: 'logout' }).click();
    });
    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/admin/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(screen.getByTestId('role').textContent).toBe('none');
    fetchSpy.mockRestore();
  });
});
