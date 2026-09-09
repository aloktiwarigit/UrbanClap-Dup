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

  const reveal = useCallback(async () => {
    setPending(true);
    setErrorKey(null);
    try {
      const result = await revealOrderContact(orderId, party);
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
      setErrorKey(errorKeyFor(err));
    } finally {
      setPending(false);
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

  if (!maskedPhone) {
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

      {canReveal && errorKey === null && (
        phone === null ? (
          <button
            type="button"
            onClick={() => { void reveal(); }}
            disabled={pending}
            aria-label={t('showNumberAria', { party: partyLabel })}
            className={controlClass}
          >
            {t('showNumber')}
          </button>
        ) : (
          <button
            type="button"
            onClick={hide}
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
