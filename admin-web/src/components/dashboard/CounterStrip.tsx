import type { components } from '@/api/generated/schema';

type DashboardSummary = components['schemas']['DashboardSummary'];

interface CounterStripProps {
  summary: DashboardSummary;
}

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

interface TileProps {
  id: string;
  label: string;
  value: string | number;
  accent: 'teal' | 'ember' | 'coral';
}

function Tile({ id, label, value, accent }: TileProps) {
  return (
    <div
      data-testid={`tile-${id}`}
      data-accent={accent}
      style={{
        background: 'var(--ink-2)',
        border: '1px solid var(--ink-4)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      <span
        style={{
          fontSize: '0.6875rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--fog-0)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '1.5rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          color:
            accent === 'teal'
              ? 'var(--teal-soft)'
              : accent === 'ember'
                ? 'var(--ember)'
                : 'var(--coral)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function CounterStrip({ summary }: CounterStripProps) {
  const {
    bookingsToday,
    gmvToday,
    commissionToday,
    payoutsPending,
    complaintsOpen,
    techsOnDuty,
  } = summary;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem',
      }}
    >
      <Tile id="bookingsToday" label="Bookings · Today" value={bookingsToday} accent="teal" />
      <Tile id="gmvToday" label="GMV · Today" value={formatPaise(gmvToday)} accent="teal" />
      <Tile
        id="commissionToday"
        label="Commission"
        value={formatPaise(commissionToday)}
        accent="ember"
      />
      <Tile
        id="payoutsPending"
        label="Payouts · Pending"
        value={formatPaise(payoutsPending)}
        accent="ember"
      />
      <Tile id="complaintsOpen" label="Complaints · Open" value={complaintsOpen} accent="coral" />
      <Tile id="techsOnDuty" label="Techs · On duty" value={techsOnDuty} accent="teal" />
    </div>
  );
}
