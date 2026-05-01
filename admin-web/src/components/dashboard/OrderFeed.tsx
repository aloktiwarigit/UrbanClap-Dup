'use client';

// TODO(E09-S01-v2): replace polling with FCM topic listener for sub-second latency

import { useState, useEffect, useCallback } from 'react';
import { EmptyState } from '@/components/EmptyState';
import type { components } from '@/api/generated/schema';

type BookingEvent = components['schemas']['BookingEvent'];

const MAX_FEED_ITEMS = 50;
const POLL_INTERVAL_MS = 30_000;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

const KIND_COLORS: Record<BookingEvent['kind'], string> = {
  booking: 'var(--teal)',
  assigned: 'var(--teal-soft)',
  completed: 'var(--fog-1)',
  alert: 'var(--rose)',
  payout: 'var(--ember)',
  complaint: 'var(--coral)',
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

async function fetchFeedEvents(): Promise<BookingEvent[]> {
  const url = `${API_BASE}/v1/admin/dashboard/feed`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) return [];
  const data = (await res.json()) as { events: BookingEvent[]; total: number };
  return data.events;
}

export function OrderFeed() {
  const [events, setEvents] = useState<BookingEvent[]>([]);

  const mergeEvents = useCallback((incoming: BookingEvent[]) => {
    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const newOnes = incoming.filter((e) => !existingIds.has(e.id));
      if (newOnes.length === 0) return prev;
      const merged = [...newOnes, ...prev];
      return merged.slice(0, MAX_FEED_ITEMS);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const incoming = await fetchFeedEvents();
      if (!cancelled) mergeEvents(incoming);
    };

    void poll();

    const timer = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [mergeEvents]);

  return (
    <section aria-label="Live order feed">
      <h2
        style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--fog-0)',
          marginBottom: '0.5rem',
        }}
      >
        Live Feed
      </h2>
      {events.length === 0 ? (
        <EmptyState
          eyebrow="Live feed"
          headline="The feed is quiet"
          copy="New bookings, assignments, and complaints will land here as they happen."
        />
      ) : (
        <ol
          aria-live="polite"
          aria-label="Order events"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {events.map((event) => (
            <li
              key={event.id}
              data-kind={event.kind}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--ink-2)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${KIND_COLORS[event.kind]}`,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--fog-2)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {event.title}
                </p>
                {event.detail !== undefined && event.detail !== '' && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.6875rem',
                      color: 'var(--fog-0)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '2px',
                    }}
                  >
                    {event.detail}
                  </p>
                )}
              </div>
              <time
                dateTime={event.createdAt}
                style={{
                  fontSize: '0.625rem',
                  color: 'var(--fog-0)',
                  fontFamily: 'var(--font-mono)',
                  alignSelf: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatTime(event.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
