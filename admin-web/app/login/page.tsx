export default function LoginStubPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          501 — Owner sign-in coming in E02-S04
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>
          This stub will be replaced by the real owner-auth flow in the next phase.
        </p>
      </div>
    </main>
  );
}
