import type { Complaint } from '@/types/complaint';

interface ComplaintCardProps {
  complaint: Complaint;
  onClick: () => void;
}

function formatSlaCountdown(slaDeadlineAt: string): { label: string; urgent: boolean } {
  const msRemaining = new Date(slaDeadlineAt).getTime() - Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  if (msRemaining <= 0) {
    return { label: 'Overdue', urgent: true };
  }

  const totalMinutes = Math.floor(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return { label, urgent: msRemaining < TWO_HOURS_MS };
}

export function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  const { label: slaLabel, urgent } = formatSlaCountdown(complaint.slaDeadlineAt);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 font-mono truncate">
            {complaint.customerId.slice(0, 12)}
          </p>
          <p className="text-xs text-gray-400 font-mono truncate">
            {complaint.orderId.slice(0, 12)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-medium ${urgent ? 'text-red-600' : 'text-gray-500'}`}>
            {slaLabel}
          </span>
          {complaint.escalated && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
              escalated
            </span>
          )}
        </div>
      </div>
      {complaint.assigneeAdminId && (
        <div className="mt-2 flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {complaint.assigneeAdminId.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-xs text-gray-400 truncate">{complaint.assigneeAdminId}</span>
        </div>
      )}
    </button>
  );
}
