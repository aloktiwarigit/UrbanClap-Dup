import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `[${ns}.${key}:${JSON.stringify(values)}]` : `[${ns}.${key}]`;
    return t;
  },
}));

// vi.mock factories are hoisted above module-scope declarations, so the
// values they close over must be created inside vi.hoisted() to avoid a
// "Cannot access before initialization" TDZ error.
const { revealOrderContact, RevealContactError } = vi.hoisted(() => {
  const revealOrderContact = vi.fn();
  class RevealContactError extends Error {
    status: number;
    code: string | undefined;
    retryAfterMs: number | undefined;
    constructor(status: number, code?: string, retryAfterMs?: number) {
      super('x');
      this.status = status;
      this.code = code;
      this.retryAfterMs = retryAfterMs;
    }
  }
  return { revealOrderContact, RevealContactError };
});
vi.mock('@/api/orders', () => ({ revealOrderContact, RevealContactError }));

import { ContactReveal } from '../../../src/components/orders/ContactReveal';

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); });

const base = {
  orderId: 'ord_1',
  party: 'CUSTOMER' as const,
  maskedPhone: '+91 XXXXX-X9999',
  canReveal: true,
};

describe('ContactReveal', () => {
  it('renders the masked number at rest', () => {
    render(<ContactReveal {...base} />);
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('hides the reveal control when the role lacks the capability', () => {
    render(<ContactReveal {...base} canReveal={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('renders the unavailable copy when there is no masked number', () => {
    render(<ContactReveal {...base} maskedPhone={undefined} />);
    expect(screen.getByText('[orders.pii.unavailable]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the full number and a tel: link after a successful reveal', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+919999999999');
  });

  it('states that the reveal was recorded', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.recorded]')).toBeInTheDocument());
  });

  it('re-masks automatically after 60 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await vi.advanceTimersByTimeAsync(60_000);
    await waitFor(() => expect(screen.queryByText('+919999999999')).toBeNull());
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('re-masks immediately when the operator hides it', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('+919999999999')).toBeNull();
    expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
  });

  it('shows the forbidden message on 403', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(403));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.forbidden]')).toBeInTheDocument());
  });

  it('shows the rate-limited message on 429', async () => {
    revealOrderContact.mockRejectedValue(new RevealContactError(429));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.rateLimited]')).toBeInTheDocument());
  });

  it('shows the generic failure message on any other error', async () => {
    revealOrderContact.mockRejectedValue(new Error('network'));
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.failed]')).toBeInTheDocument());
  });

  it('requests the party it was given', async () => {
    revealOrderContact.mockResolvedValue({
      party: 'TECHNICIAN', phone: '+919876544321', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} party="TECHNICIAN" maskedPhone="+91 XXXXX-X4321" />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(revealOrderContact).toHaveBeenCalledWith('ord_1', 'TECHNICIAN'));
  });

  // Finding 2: the API returns the placeholder mask '••••••••••'
  // (MASK_PLACEHOLDER in api/src/lib/pii/mask.ts) when there is no number on
  // file at all. That is a non-empty string, so it must be treated as "no
  // number on file" — same branch as maskedPhone === undefined — rather than
  // rendering a reveal control that can only end in a wasted budget spend
  // and a generic error.
  it('renders the unavailable copy (and no button) when maskedPhone is the all-bullet placeholder mask', () => {
    render(<ContactReveal {...base} maskedPhone="••••••••••" />);
    expect(screen.getByText('[orders.pii.unavailable]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  // Finding 3: `phone` is component state. If the component instance is
  // reused with new props (e.g. an admin reassigns the technician in an
  // open drawer while that technician's number is revealed), the previous
  // person's raw number must not remain on screen attributed to the new
  // subject.
  describe('Finding 3 — resets revealed state when the subject identity changes', () => {
    it('clears the revealed phone when maskedPhone changes on the same instance', async () => {
      revealOrderContact.mockResolvedValue({
        party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
      });
      const { rerender } = render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());

      rerender(<ContactReveal {...base} maskedPhone="+91 XXXXX-X1234" />);

      expect(screen.queryByText('+919999999999')).toBeNull();
      expect(screen.getByText('+91 XXXXX-X1234')).toBeInTheDocument();
    });

    it('clears the revealed phone when party changes on the same instance', async () => {
      revealOrderContact.mockResolvedValue({
        party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
      });
      const { rerender } = render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());

      rerender(<ContactReveal {...base} party="TECHNICIAN" maskedPhone="+91 XXXXX-X4321" />);

      expect(screen.queryByText('+919999999999')).toBeNull();
      expect(screen.getByText('+91 XXXXX-X4321')).toBeInTheDocument();
    });

    it('still auto-remasks after 60 seconds (no regression from the reset effect)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      revealOrderContact.mockResolvedValue({
        party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
      });
      render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
      await vi.advanceTimersByTimeAsync(60_000);
      await waitFor(() => expect(screen.queryByText('+919999999999')).toBeNull());
      expect(screen.getByText('+91 XXXXX-X9999')).toBeInTheDocument();
    });
  });

  // Codex round 2, Finding 2: a reveal in flight when the component's
  // subject changes must never commit the previous subject's raw number
  // under the new props. The reset effect (Finding 3, above) only clears
  // already-revealed state; it does nothing about a promise that is still
  // pending when the subject changes mid-flight.
  describe('Codex round 2, Finding 2 — a stale in-flight reveal must not render under new props', () => {
    it('does not render the resolved number when maskedPhone changes before the reveal promise resolves', async () => {
      let resolveReveal: (v: { party: 'CUSTOMER'; phone: string; revealedAt: string }) => void;
      revealOrderContact.mockReturnValueOnce(
        new Promise((resolve) => { resolveReveal = resolve; }),
      );
      const { rerender } = render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));

      // Subject changes (new masked number) while the reveal is still in flight.
      rerender(<ContactReveal {...base} maskedPhone="+91 XXXXX-X1234" />);

      // The stale promise now resolves with the PREVIOUS subject's number.
      await act(async () => {
        resolveReveal!({ party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z' });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByText('+919999999999')).toBeNull();
      expect(screen.getByText('+91 XXXXX-X1234')).toBeInTheDocument();
    });

    it('does not render the resolved number when party changes before the reveal promise resolves', async () => {
      let resolveReveal: (v: { party: 'CUSTOMER'; phone: string; revealedAt: string }) => void;
      revealOrderContact.mockReturnValueOnce(
        new Promise((resolve) => { resolveReveal = resolve; }),
      );
      const { rerender } = render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));

      rerender(<ContactReveal {...base} party="TECHNICIAN" maskedPhone="+91 XXXXX-X4321" />);

      await act(async () => {
        resolveReveal!({ party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z' });
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByText('+919999999999')).toBeNull();
      expect(screen.getByText('+91 XXXXX-X4321')).toBeInTheDocument();
    });
  });

  // Codex round 2, Finding 3: in OrdersTable, the reveal button sits inside
  // a `<tr onClick={() => onRowClick(order)}>`. Without isolation, clicking
  // "Show number" bubbles to the row, opens the slide-over drawer behind the
  // in-flight reveal, and the operator typically reveals a second time from
  // the drawer — a second audit entry for one intent.
  describe('Codex round 2, Finding 3 — reveal click must not bubble to a row click handler', () => {
    it('does not invoke a row-level onClick when the reveal button is clicked, but does call revealOrderContact', async () => {
      revealOrderContact.mockResolvedValue({
        party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
      });
      const rowOnClick = vi.fn();
      render(
        <table>
          <tbody>
            <tr onClick={rowOnClick}>
              <td>
                <ContactReveal {...base} />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      await userEvent.click(screen.getByRole('button'));

      expect(rowOnClick).not.toHaveBeenCalled();
      expect(revealOrderContact).toHaveBeenCalledWith('ord_1', 'CUSTOMER');
    });

    it('does not invoke a row-level onClick when the hide-now button is clicked', async () => {
      revealOrderContact.mockResolvedValue({
        party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
      });
      const rowOnClick = vi.fn();
      render(
        <table>
          <tbody>
            <tr onClick={rowOnClick}>
              <td>
                <ContactReveal {...base} />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      await userEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
      rowOnClick.mockClear();

      await userEvent.click(screen.getByRole('button')); // "Hide now"

      expect(rowOnClick).not.toHaveBeenCalled();
    });
  });

  // Finding 5: `canReveal && errorKey === null` removed the button after any
  // failure, but the error copy says "Try again" — a dead end for
  // transient 502/429/network failures.
  it('Finding 5 — keeps a usable retry button visible after a failed reveal, and retrying calls revealOrderContact again', async () => {
    revealOrderContact.mockRejectedValueOnce(new Error('network'));
    revealOrderContact.mockResolvedValueOnce({
      party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z',
    });
    render(<ContactReveal {...base} />);
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('[orders.pii.errors.failed]')).toBeInTheDocument());

    const retryButton = screen.getByRole('button');
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);
    await waitFor(() => expect(screen.getByText('+919999999999')).toBeInTheDocument());
    expect(revealOrderContact).toHaveBeenCalledTimes(2);
  });

  // Codex round 3, Finding 1: the subject-change reset effect cleared
  // `phone`, `errorKey` and `secondsLeft` but not `pending`. If a reveal is
  // still in flight when the subject changes, the effect invalidates the
  // request, and the stale request's `finally` refuses to clear `pending`
  // because the request id no longer matches — the new subject's button
  // stays disabled forever.
  describe('Codex round 3, Finding 1 — pending must not survive a subject change', () => {
    it('does not leave the new subject\'s button disabled when maskedPhone changes mid-flight, and the stale resolution is a no-op', async () => {
      let resolveStale: (v: { party: 'CUSTOMER'; phone: string; revealedAt: string }) => void;
      let resolveFresh: (v: { party: 'CUSTOMER'; phone: string; revealedAt: string }) => void;
      revealOrderContact.mockReturnValueOnce(
        new Promise((resolve) => { resolveStale = resolve; }),
      );
      const { rerender } = render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toBeDisabled();

      // Subject changes while the reveal is still in flight.
      rerender(<ContactReveal {...base} maskedPhone="+91 XXXXX-X1234" />);

      const newButton = screen.getByRole('button');
      expect(newButton).not.toBeDisabled();

      // It must actually be clickable, and clicking it must start a genuine
      // new reveal for the current subject (a second call to
      // revealOrderContact) — not a no-op left over from the disabled state.
      revealOrderContact.mockReturnValueOnce(
        new Promise((resolve) => { resolveFresh = resolve; }),
      );
      await userEvent.click(newButton);
      expect(revealOrderContact).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button')).toBeDisabled(); // pending again, for the NEW subject

      // Let the stale (first) promise resolve; it must be a no-op — no
      // crash, and it must never render the previous subject's number.
      await act(async () => {
        resolveStale!({ party: 'CUSTOMER', phone: '+919999999999', revealedAt: '2026-09-08T00:00:00.000Z' });
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.queryByText('+919999999999')).toBeNull();
      // The fresh (current) reveal is still pending — the stale resolution
      // must not have cleared it, disabled/enabled it incorrectly, or
      // resolved it on the fresh request's behalf.
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolving the fresh reveal completes normally for the new subject.
      await act(async () => {
        resolveFresh!({ party: 'CUSTOMER', phone: '+911234567890', revealedAt: '2026-09-08T00:00:00.000Z' });
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText('+911234567890')).toBeInTheDocument();
      expect(screen.queryByText('+919999999999')).toBeNull();
    });
  });

  // Codex round 3, Finding 2: the API distinguishes the per-minute cap
  // (429 RATE_LIMITED) from the rolling-24h daily cap (429 RATE_LIMITED_DAILY).
  // Collapsing both into the same "try again in a minute" copy misleads the
  // admin when the real wait is hours.
  describe('Codex round 3, Finding 2 — daily rate-limit gets its own message', () => {
    it('shows the daily-cap message on 429 RATE_LIMITED_DAILY', async () => {
      revealOrderContact.mockRejectedValue(new RevealContactError(429, 'RATE_LIMITED_DAILY', 3_600_000));
      render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() =>
        expect(screen.getByText('[orders.pii.errors.rateLimitedDaily]')).toBeInTheDocument(),
      );
    });

    it('still shows the per-minute message on 429 RATE_LIMITED', async () => {
      revealOrderContact.mockRejectedValue(new RevealContactError(429, 'RATE_LIMITED', 5_000));
      render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() =>
        expect(screen.getByText('[orders.pii.errors.rateLimited]')).toBeInTheDocument(),
      );
    });

    it('falls back to the per-minute message when the 429 body is unparseable (no code)', async () => {
      revealOrderContact.mockRejectedValue(new RevealContactError(429, undefined, undefined));
      render(<ContactReveal {...base} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() =>
        expect(screen.getByText('[orders.pii.errors.rateLimited]')).toBeInTheDocument(),
      );
    });
  });
});
