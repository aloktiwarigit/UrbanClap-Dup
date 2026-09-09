'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatDate } from '@/lib/format/intl';

/**
 * Mirrors the `override` shape on `CommissionDashboardRow`/`CommissionLedgerDetail['hold']`
 * (both resolve to the generated `CommissionHoldOverride` schema) without importing the api
 * module directly, so this file has no dependency on the generated schema shape beyond the three
 * fields it actually renders.
 */
export interface HoldChipOverride {
  until: string;
  byAdminId: string;
  reason: string;
}

export interface HoldChipProps {
  state: 'CLEAR' | 'WARN' | 'BLOCKED';
  override?: HoldChipOverride;
}

/**
 * Reused by Tasks 7 (detail page) and 10. Design doc §2/§3 binding rules:
 *
 * - CLEAR renders nothing but an em-dash — no green "healthy" badge, because a badge on every
 *   healthy row trains the eye to skip badges. The common case must be quiet.
 * - An operator override is never encoded in colour alone — it always names the actor and date
 *   as an explicit chip, because in a dispute the owner needs to know who did it and when. This
 *   supersedes the bare state label even when the underlying state is WARN/BLOCKED: the override
 *   is the more important fact once one exists.
 */
export function HoldChip({ state, override }: HoldChipProps) {
  const t = useTranslations('commissions');
  const locale = useLocale();

  if (override !== undefined) {
    return (
      <span
        className="font-mono text-xs text-[var(--color-text)]"
        title={override.reason}
      >
        {t('holdChip.override', {
          actor: override.byAdminId,
          date: formatDate(override.until, locale),
        })}
      </span>
    );
  }

  if (state === 'CLEAR') {
    return <span className="text-[var(--color-text-muted)]">—</span>;
  }

  const isBlocked = state === 'BLOCKED';
  return (
    <span
      className={`font-medium ${isBlocked ? 'text-[var(--color-danger)]' : 'text-[var(--color-warn)]'}`}
    >
      {isBlocked ? t('holdChip.blocked') : t('holdChip.warn')}
    </span>
  );
}
