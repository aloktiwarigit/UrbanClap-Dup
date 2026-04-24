import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { OrderFeed } from '../../../src/components/dashboard/OrderFeed';
import type { components } from '../../../src/api/generated/schema';

type BookingEvent = components['schemas']['BookingEvent'];

const makeEvent = (id: string, overrides?: Partial<BookingEvent>): BookingEvent => ({
  id,
  bookingId: `b-${id}`,
  status: 'pending',
  customerId: 'cust-1',
  serviceId: 'svc-1',
  amount: 50000,
  createdAt: new Date().toISOString(),
  kind: 'booking',
  title: `Event ${id}`,
  detail: `Detail ${id}`,
  ...overrides,
});

const initialEvents: BookingEvent[] = [
  makeEvent('evt-1', { kind: 'booking', title: 'New booking' }),
  makeEvent('evt-2', { kind: 'assigned', title: 'Technician assigned' }),
  makeEvent('evt-3', { kind: 'completed', title: 'Job completed' }),
];

function makeSuccessResponse(events: BookingEvent[]): Response {
  return new Response(
    JSON.stringify({ events, total: events.length }),
    { headers: { 'content-type': 'application/json' } },
  );
}

describe('OrderFeed', () => {
  beforeEach(() => {
    // Each call must return a fresh Response — Response bodies can only be consumed once.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(makeSuccessResponse(initialEvents)),
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('calls fetch on mount to load initial events', async () => {
    render(<OrderFeed />);
    await waitFor(() => {
      const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
      expect(mock).toHaveBeenCalledTimes(1);
    });
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const firstCall = mock.mock.calls[0] as [string, ...unknown[]];
    expect(firstCall[0]).toContain('/v1/admin/dashboard/feed');
  });

  it('renders initial events list after mount fetch', async () => {
    render(<OrderFeed />);
    await waitFor(() => {
      expect(screen.getByText('New booking')).toBeDefined();
    });
    expect(screen.getByText('Technician assigned')).toBeDefined();
    expect(screen.getByText('Job completed')).toBeDefined();
  });

  it('has aria-live="polite" on the live region', async () => {
    render(<OrderFeed />);
    await waitFor(() => {
      const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
      expect(mock).toHaveBeenCalledTimes(1);
    });
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
  });

  it('each event row has data-kind attribute', async () => {
    render(<OrderFeed />);
    await waitFor(() => {
      expect(screen.getByText('New booking')).toBeDefined();
    });
    const bookingRows = document.querySelectorAll('[data-kind="booking"]');
    expect(bookingRows.length).toBeGreaterThanOrEqual(1);
  });

  it('does not duplicate events when poll returns same data', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<OrderFeed />);
    // Wait for initial fetch
    await vi.waitFor(() => {
      const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
      expect(mock).toHaveBeenCalledTimes(1);
    });
    // Advance 30s to trigger second poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    await vi.waitFor(() => {
      const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
      expect(mock).toHaveBeenCalledTimes(2);
    });
    // Should still have exactly 3 unique events — no duplication
    const rows = document.querySelectorAll('[data-kind]');
    expect(rows.length).toBe(3);
  });

  it('caps feed at 50 items', async () => {
    const manyEvents = Array.from({ length: 60 }, (_, i) => makeEvent(`bulk-${i}`));
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve(makeSuccessResponse(manyEvents)),
    ));
    render(<OrderFeed />);
    await waitFor(() => {
      const rows = document.querySelectorAll('[data-kind]');
      expect(rows.length).toBeLessThanOrEqual(50);
    });
  });

  it('prepends new events on subsequent polls', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const newEvent = makeEvent('evt-new', { kind: 'alert', title: 'New alert event' });
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        const events = callCount === 1 ? initialEvents : [newEvent, ...initialEvents];
        return Promise.resolve(makeSuccessResponse(events));
      }),
    );
    render(<OrderFeed />);
    await vi.waitFor(() => {
      expect(screen.getByText('New booking')).toBeDefined();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    await vi.waitFor(() => {
      expect(screen.queryByText('New alert event')).not.toBeNull();
    });
  });
});
