/**
 * Canonical INR money formatter for admin-web. All currency amounts in this
 * app are transported as integer paise (1/100 rupee) — mirrors the Android
 * `Money.kt` convention from S-31. Every money-rendering call site should
 * route through this function (or `paiseToRupeeNumber` for unformatted
 * numeric output, e.g. CSV export) rather than reimplementing paise/100
 * division inline.
 *
 * Defensively rounds the input to the nearest whole paise before dividing,
 * so an upstream float-serialization artifact (e.g. `59900.00000000001`
 * from a backend that round-trips amounts through a floating-point type)
 * cannot introduce visible rounding drift in the formatted output — the
 * same class of bug S-31 fixed for the Android `formatInr` call sites.
 *
 * @param options Optional Intl.NumberFormatOptions overrides, merged over
 *   the currency-style defaults — e.g. `{ minimumFractionDigits: 0,
 *   maximumFractionDigits: 0 }` for compact chart-axis ticks.
 */
export function formatINR(
  paise: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  const rupees = paiseToRupeeNumber(paise);
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    style: 'currency',
    currency: 'INR',
    ...options,
  }).format(rupees);
}

/**
 * Converts integer paise to an unformatted rupee number — no currency
 * symbol, no locale grouping. Use for machine-readable output (CSV export,
 * API payloads) where `formatINR`'s human-readable string is not
 * appropriate. Applies the same defensive whole-paise rounding as
 * `formatINR` before dividing, to avoid float-drift on non-integer input.
 */
export function paiseToRupeeNumber(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Converts an operator-typed rupee amount (e.g. the orders Min/Max ₹ filter
 * inputs) into integer paise — the wire format every amount field in this
 * app uses unless explicitly named otherwise (see `amountRupees` in
 * `RefundCreditBodySchema` for the one deliberate, documented exception).
 *
 * This is the boundary conversion: UI inputs collect rupees because that is
 * what operators think in, but the API/Cosmos layer only ever operates on
 * paise, so the conversion must happen here before the value leaves the
 * client — never on the server, which has no way to know the value arrived
 * unconverted.
 *
 * Uses integer-safe rounding (`Math.round`) rather than raw multiplication
 * to avoid float artifacts (e.g. `499.99999999999994` from `4999.9999... *
 * 100` style drift). Returns `undefined` for blank or non-numeric input so
 * callers can omit the filter entirely instead of sending `NaN`.
 */
export function rupeesToPaise(rupees: string | number): number | undefined {
  if (typeof rupees === 'string' && rupees.trim() === '') return undefined;
  const value = typeof rupees === 'number' ? rupees : Number(rupees);
  if (!Number.isFinite(value)) return undefined;
  return Math.round(value * 100);
}

export function formatDate(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}
