'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { revealOrderContact, RevealContactError } from '@/api/orders';
import type { RevealParty } from '@/types/order';

/** Seconds a revealed number stays on screen before it re-masks itself. */
const REVEAL_SECONDS = 60;

interface ContactRevealProps {
  orderId: string;
  party: RevealParty;
  /** Masked number from the API. Undefined when there is no number on file. */
  maskedPhone: string | undefined;
  /** False when the signed-in role lacks orders.revealContact. */
  canReveal: boolean;
  /** 'inline' sits in a table cell; 'block' sits in the order drawer. */
  variant?: 'inline' | 'block';
}

type ErrorKey = 'forbidden' | 'rateLimited' | 'failed';

function errorKeyFor(err: unknown): ErrorKey {
  if (err instanceof RevealContactError) {
    if (err.status === 403) return 'forbidden';
    if (err.status === 429) return 'rateLimited';
  }
  return 'failed';
}

/**
 * Resolved through an explicit switch rather than t(`errors.${key}`):
 * next-intl types t()'s argument as a literal union, so a template-literal
 * key fails the typecheck.
 */
function errorMessage(t: (key: string) => string, key: ErrorKey): string {
  switch (key) {
    case 'forbidden':
      return t('errors.forbidden');
    case 'rateLimited':
      return t('errors.rateLimited');
    default:
      return t('errors.failed');
  }
}

export function ContactReveal({
  orderId,
  party,
  maskedPhone,
  canReveal,
  variant = 'inline',
}: ContactRevealProps) {
  const t = useTranslations('orders.pii');
  const [phone, setPhone] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Codex round 2, Finding 2: guards against a stale in-flight reveal. If
  // this component instance is reused for a different subject (orderId,
  // party, or maskedPhone changes — see the reset effect below) before an
  // in-flight reveal() promise resolves, that promise's resolution must not
  // commit the PREVIOUS subject's raw number under the new props. Bumped on
  // every new reveal attempt and on every subject change; a response is only
  // committed if the request id it was issued under is still current.
  const requestIdRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    stopTimer();
    setPhone(null);
    setSecondsLeft(REVEAL_SECONDS);
  }, [stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  // Finding 3: this component instance can be reused with new props (e.g.
  // an admin reassigns the technician in an open drawer while that
  // technician's number is revealed). `phone` is component state, so
  // without this reset the previous subject's raw number stays on screen
  // attributed to the new one — the worst failure this component can
  // produce. Reset on any change of subject identity (orderId, party) or
  // of the masked number itself (maskedPhone), which changes whenever the
  // underlying phone-on-file changes even for the same order/party.
  useEffect(() => {
    // Invalidate any reveal that is still in flight for the previous
    // subject — its eventual resolution must be a no-op (see reveal() below).
    requestIdRef.current += 1;
    stopTimer();
    setPhone(null);
    setSecondsLeft(REVEAL_SECONDS);
    setErrorKey(null);
  }, [orderId, party, maskedPhone, stopTimer]);

  const reveal = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);
    setPending(true);
    setErrorKey(null);
    try {
      const result = await revealOrderContact(orderId, party);
      // The subject may have changed while this request was in flight (a
      // new reveal was started, or the reset effect above bumped the id in
      // response to a prop change). A stale response must never be
      // committed under the new subject's props.
      if (requestIdRef.current !== requestId) return;
      setPhone(result.phone);
      setSecondsLeft(REVEAL_SECONDS);
      stopTimer();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((remaining) => {
          if (remaining <= 1) {
            stopTimer();
            setPhone(null);
            return REVEAL_SECONDS;
          }
          return remaining - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (requestIdRef.current !== requestId) return;
      setErrorKey(errorKeyFor(err));
    } finally {
      if (requestIdRef.current === requestId) setPending(false);
    }
  }, [orderId, party, stopTimer]);

  const partyLabel = t(party === 'CUSTOMER' ? 'party.customer' : 'party.technician');
  const numberClass =
    'font-mono tabular-nums text-[var(--color-text)] transition-opacity duration-[120ms] motion-reduce:transition-none';
  const controlClass =
    'text-left text-xs text-[var(--color-text-faint)] underline decoration-dotted underline-offset-2 ' +
    'transition-colors duration-[120ms] motion-reduce:transition-none hover:text-[var(--color-text-muted)] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--color-focus-ring)] disabled:opacity-60';

  // Finding 2: when there is no number on file at all, the API returns the
  // placeholder mask MASK_PLACEHOLDER ('••••••••••', see
  // api/src/lib/pii/mask.ts) rather than an empty string. A structural
  // check — a mask made up entirely of bullet characters — catches that
  // case without duplicating the API's exact placeholder string across the
  // package boundary.
  const isPlaceholderMask = maskedPhone !== undefined && /^•+$/.test(maskedPhone);

  if (!maskedPhone || isPlaceholderMask) {
    return (
      <span className="text-xs italic text-[var(--color-text-faint)]">{t('unavailable')}</span>
    );
  }

  return (
    <div className={variant === 'block' ? 'flex flex-col gap-1' : 'flex flex-col gap-0.5'}>
      {phone === null ? (
        <span className={`${numberClass} text-xs`}>{maskedPhone}</span>
      ) : (
        <a href={`tel:${phone}`} className={`${numberClass} text-xs underline underline-offset-2`}>
          {phone}
        </a>
      )}

      {/*
        Finding 5: the control must stay visible after a failed reveal — the
        error copy says "Try again", so hiding the only control that lets an
        admin retry turns a transient 502/429/network failure into a dead
        end. `phone` stays null whenever errorKey is set (reveal() never
        sets phone on a failed attempt), so this always renders the "Show
        number" branch during an error state; reveal() itself clears
        errorKey at the start of each attempt.
      */}
      {/*
        Codex round 2, Finding 3: in OrdersTable this component sits inside
        a `<tr onClick={() => onRowClick(order)}>`. Without isolating this
        click, "Show number" bubbles to the row, opens the slide-over drawer
        behind the in-flight reveal, and the operator typically reveals a
        second time from the drawer — a second audit entry for one intent.
        `stopPropagation()` in the onClick handler covers keyboard activation
        too: activating a native <button> via Enter/Space dispatches the same
        'click' event that a mouse click does, so there is no separate
        keyboard path to guard.
      */}
      {canReveal && (
        phone === null ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void reveal(); }}
            disabled={pending}
            aria-label={t('showNumberAria', { party: partyLabel })}
            className={controlClass}
          >
            {t('showNumber')}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); hide(); }}
            aria-label={t('hideNowAria')}
            className={controlClass}
          >
            {t('hideNow', { seconds: secondsLeft })}
          </button>
        )
      )}

      {canReveal && errorKey === null && phone !== null && (
        <span className="text-xs text-[var(--color-text-faint)]">{t('recorded')}</span>
      )}

      {errorKey !== null && (
        <span role="status" className="text-xs text-[var(--color-danger)]">
          {errorMessage(t, errorKey)}
        </span>
      )}
    </div>
  );
}
