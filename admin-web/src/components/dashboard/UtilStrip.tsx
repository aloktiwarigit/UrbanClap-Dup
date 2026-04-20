'use client';

// TODO(E09-S02): wire to /v1/admin/dashboard/utilisation

const SEED_DATA: number[] = [
  15, 22, 18, 30, 45, 60, 72, 85, 90, 88, 76, 65,
  70, 78, 82, 88, 92, 85, 75, 60, 48, 35, 22, 10,
];

interface UtilStripProps {
  utilData?: number[];
}

function barColor(value: number): string {
  if (value > 75) return 'var(--coral)';
  if (value < 15) return 'var(--fog-0)';
  return 'var(--teal)';
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'am' : 'pm';
  return `${h}${ampm}`;
});

export function UtilStrip({ utilData }: UtilStripProps) {
  const data = utilData ?? SEED_DATA;

  return (
    <section aria-label="Technician utilisation — 24h">
      <h2
        style={{
          fontSize: '0.6875rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--fog-0)',
          marginBottom: '0.5rem',
        }}
      >
        Utilisation · 24h
      </h2>
      <div
        role="img"
        aria-label="Bar chart of technician utilisation over 24 hours"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '2px',
          height: '48px',
          background: 'var(--ink-2)',
          borderRadius: '6px',
          padding: '6px 8px 0',
          overflow: 'hidden',
        }}
      >
        {data.map((value, index) => (
          <div
            key={index}
            title={`${HOURS[index] ?? `${index}h`}: ${value}%`}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              height: `${value}%`,
              background: barColor(value),
              borderRadius: '2px 2px 0 0',
              transition: 'height 200ms ease',
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2px',
          paddingInline: '8px',
        }}
      >
        {['12am', '6am', '12pm', '6pm', '12am'].map((label) => (
          <span
            key={label}
            style={{
              fontSize: '0.5625rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fog-0)',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
