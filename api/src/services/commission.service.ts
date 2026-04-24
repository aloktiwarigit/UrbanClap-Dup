export interface CommissionResult {
  commissionBps: number;
  commissionAmount: number;
  techAmount: number;
}

export function calculateCommission(
  completedJobCount: number,
  bookingAmountPaise: number,
): CommissionResult {
  const commissionBps = completedJobCount >= 50 ? 2500 : 2200;
  const commissionAmount = Math.round((bookingAmountPaise * commissionBps) / 10000);
  const techAmount = bookingAmountPaise - commissionAmount;
  return { commissionBps, commissionAmount, techAmount };
}
