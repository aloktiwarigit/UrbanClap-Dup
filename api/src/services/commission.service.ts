export interface CommissionResult {
  commissionBps: number;
  commissionAmount: number;
  techAmount: number;
}

export function calculateCommission(
  bookingAmountPaise: number,
  commissionBps: number,
): CommissionResult {
  const commissionAmount = Math.round((bookingAmountPaise * commissionBps) / 10000);
  const techAmount = bookingAmountPaise - commissionAmount;
  return { commissionBps, commissionAmount, techAmount };
}
