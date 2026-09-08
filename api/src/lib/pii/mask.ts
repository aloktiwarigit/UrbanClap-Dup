/**
 * The single source of PII masking for the API.
 *
 * Every surface that renders a phone number or a UPI VPA to an admin — order
 * lists, order details, CSV exports, technician and customer rosters — goes
 * through here. The only path that may emit an unmasked value is
 * POST /v1/admin/orders/{id}/reveal-contact, which is role-gated,
 * rate-limited and audit-logged (ADR 0034).
 *
 * Both functions return a fixed-width mask so the output never leaks the
 * length of the input.
 */

/** Rendered when there is nothing safe to show. */
export const MASK_PLACEHOLDER = '••••••••••';

/** Fixed-width bullet run used inside a masked VPA handle. */
const VPA_HANDLE_MASK = '••••••';

/**
 * `+919876543210` -> `+91 XXXXX-X3210`
 *
 * The last four digits are kept deliberately: they are what an operator
 * matches against their own call log, and four digits alone do not identify
 * a person. Anything shorter than four characters is masked entirely.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || phone.length < 4) return MASK_PLACEHOLDER;
  return `+91 XXXXX-X${phone.slice(-4)}`;
}

/**
 * `alok.tiwari@okhdfcbank` -> `al••••••@okhdfcbank`
 *
 * The PSP suffix is not personal data and is kept in full so an admin can
 * confirm which bank app the technician uses. The handle keeps two leading
 * characters for recognition; handles shorter than three characters are
 * masked entirely rather than being reduced to a near-plaintext hint.
 */
export function maskVpa(vpa: string | null | undefined): string {
  if (!vpa) return MASK_PLACEHOLDER;
  const separator = vpa.indexOf('@');
  if (separator <= 0 || separator === vpa.length - 1) return MASK_PLACEHOLDER;

  const handle = vpa.slice(0, separator);
  const psp = vpa.slice(separator + 1);
  if (handle.length < 3) return `••••••••@${psp}`;
  return `${handle.slice(0, 2)}${VPA_HANDLE_MASK}@${psp}`;
}
