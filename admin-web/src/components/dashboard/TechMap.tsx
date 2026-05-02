'use client';

import type { components } from '@/api/generated/schema';
import { EmptyState } from '@/components/EmptyState';

// Future: swap for @vis.gl/react-google-maps once Maps SDK billing confirmed
type TechLocation = components['schemas']['TechLocation'];

interface TechMapProps {
  techs: TechLocation[];
}

// Ayodhya operational bounding box (~10km radius around city centre [82.20, 26.79])
const LAT_MIN = 26.70;
const LAT_MAX = 26.88;
const LNG_MIN = 82.10;
const LNG_MAX = 82.30;

function pinLeft(lng: number): number {
  return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
}

function pinTop(lat: number): number {
  return (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;
}

const STATE_COLORS: Record<TechLocation['state'], string> = {
  active: 'var(--teal)',
  enroute: 'var(--ember)',
  idle: 'var(--fog-0)',
  alert: 'var(--rose)',
};

export function TechMap({ techs }: TechMapProps) {
  return (
    <div
      role="img"
      aria-label="Technician locations map — Ayodhya operational zone"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        background: 'var(--ink-1)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        border: '1px solid var(--ink-4)',
      }}
    >
      {/* CSS grid lines */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vertical lines */}
        {[20, 40, 60, 80].map((pct) => (
          <line
            key={`v-${pct}`}
            x1={`${pct}%`}
            y1="0%"
            x2={`${pct}%`}
            y2="100%"
            stroke="var(--fog-0)"
            strokeWidth="1"
          />
        ))}
        {/* Horizontal lines */}
        {[25, 50, 75].map((pct) => (
          <line
            key={`h-${pct}`}
            x1="0%"
            y1={`${pct}%`}
            x2="100%"
            y2={`${pct}%`}
            stroke="var(--fog-0)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Empty state overlay when no techs on duty */}
      {techs.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <EmptyState
            eyebrow="Field map"
            headline="No technicians on duty"
            copy="Pins will appear here once techs come online."
          />
        </div>
      )}

      {/* Tech pins */}
      {techs.map((tech) => {
        const left = pinLeft(tech.lng);
        const top = pinTop(tech.lat);
        const color = STATE_COLORS[tech.state];
        return (
          <div
            key={tech.technicianId}
            data-testid={`pin-${tech.technicianId}`}
            data-state={tech.state}
            role="img"
            aria-label={`${tech.name ?? tech.technicianId} — ${tech.state}`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 0 2px var(--ink-1), 0 0 0 3px ${color}`,
              cursor: 'default',
            }}
          />
        );
      })}

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          display: 'flex',
          gap: '8px',
          background: 'rgba(14, 20, 22, 0.85)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
        }}
      >
        {(
          [
            ['active', 'var(--teal)', 'Active'],
            ['enroute', 'var(--ember)', 'En route'],
            ['idle', 'var(--fog-0)', 'Idle'],
            ['alert', 'var(--rose)', 'Alert'],
          ] as const
        ).map(([state, color, label]) => (
          <span
            key={state}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.625rem',
              color: 'var(--fog-1)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
