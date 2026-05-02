'use client';

// TODO(E10-S03): wire CTA to payout approval endpoint

interface PayoutQueueProps {
  payoutsPending: number; // paise
  techCount: number;
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function PayoutQueue({ payoutsPending, techCount }: PayoutQueueProps) {
  return (
    <section
      aria-label="Payout queue"
      style={{
        background: 'var(--ink-2)',
        border: '1px solid var(--ink-4)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.25rem',
      }}
    >
      <h2
        style={{
          fontSize: '0.6875rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--fog-0)',
          marginBottom: '0.75rem',
        }}
      >
        Payout Queue
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--fog-1)', fontFamily: 'var(--font-body)' }}>
            Total pending
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ember)',
            }}
          >
            {formatPaise(payoutsPending)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--fog-1)', fontFamily: 'var(--font-body)' }}>
            Technicians
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--fog-2)' }}>
            {techCount}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--fog-1)', fontFamily: 'var(--font-body)' }}>
            Schedule
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--fog-0)' }}>
            Weekly · Sun 23:59 IST
          </span>
        </div>

        {payoutsPending === 0 ? (
          <p
            style={{
              margin: 0,
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-faint)',
              fontStyle: 'italic',
            }}
          >
            Nothing pending — payouts cleared.
          </p>
        ) : (
          <div style={{ marginTop: '0.5rem', position: 'relative', display: 'inline-block' }}>
            <button
              disabled
              aria-disabled="true"
              aria-describedby="payout-cta-tooltip"
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--ink-5)',
                background: 'var(--ink-3)',
                color: 'var(--fog-0)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
            >
              Approve all payouts
            </button>
            <span
              id="payout-cta-tooltip"
              role="tooltip"
              style={{
                display: 'none', // shown via CSS :hover on parent — simplified for SSR compatibility
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--ink-0)',
                color: 'var(--fog-1)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              Coming in E10-S03
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
