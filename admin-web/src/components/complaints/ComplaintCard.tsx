import { useTranslations } from 'next-intl';
import type { Complaint } from '@/types/complaint';

interface ComplaintCardProps {
  complaint: Complaint;
  tick?: number; // shared board-level tick drives SLA recomputation
  onClick: () => void;
}

interface SlaCountdown {
  hours: number;
  minutes: number;
  overdue: boolean;
  urgent: boolean;
  resolved?: boolean;
}

function computeSlaCountdown(slaDeadlineAt: string): SlaCountdown {
  const msRemaining = new Date(slaDeadlineAt).getTime() - Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  if (msRemaining <= 0) {
    return { hours: 0, minutes: 0, overdue: true, urgent: true };
  }

  const totalMinutes = Math.floor(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, overdue: false, urgent: msRemaining < TWO_HOURS_MS };
}

export function ComplaintCard({ complaint, tick: _tick, onClick }: ComplaintCardProps) {
  const t = useTranslations('complaints');
  const isResolved = complaint.status === 'RESOLVED';

  const slaCountdown = isResolved ? null : computeSlaCountdown(complaint.slaDeadlineAt);

  let slaLabel: string;
  let urgent: boolean;
  if (isResolved) {
    slaLabel = t('card.sla.resolved');
    urgent = false;
  } else if (slaCountdown!.overdue) {
    slaLabel = t('card.sla.overdue');
    urgent = true;
  } else {
    slaLabel = slaCountdown!.hours > 0
      ? t('card.sla.countdown.hm', { h: slaCountdown!.hours, m: slaCountdown!.minutes })
      : t('card.sla.countdown.m', { m: slaCountdown!.minutes });
    urgent = slaCountdown!.urgent;
  }

  // Rendered as <div> not <button> because @hello-pangea/dnd already wraps this
  // node in a `role="button" tabindex="0"` drag handle; a nested <button> would
  // fail WCAG 4.1.2 (nested-interactive). Mouse clicks still open the slide-over;
  // keyboard activation flows through the drag handle. Dedicated keyboard "open"
  // affordance (e.g. dblclick or detail icon) tracked separately.
  return (
    <div
      role="presentation"
      data-testid="complaint-card"
      onClick={onClick}
      className="w-full text-left bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
            {complaint.customerId.slice(0, 12)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] font-mono truncate">
            {complaint.orderId.slice(0, 12)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            data-urgent={urgent ? '' : undefined}
            className={`text-xs font-medium ${urgent ? 'text-[var(--rose)]' : 'text-[var(--color-text-muted)]'}`}
          >
            {slaLabel}
          </span>
          {complaint.escalated && (
            <span className="chip chip-danger">{t('card.badge.escalated')}</span>
          )}
        </div>
      </div>
      {complaint.assigneeAdminId && (
        <div className="mt-2 flex items-center gap-1">
          <span className="chip chip-info chip-numeral">
            {complaint.assigneeAdminId.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] truncate">{complaint.assigneeAdminId}</span>
        </div>
      )}
    </div>
  );
}
