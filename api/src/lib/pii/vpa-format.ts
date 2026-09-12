/**
 * Format-only check for a UPI VPA: exactly one '@', non-empty local part and
 * handle, no whitespace. Does NOT verify the VPA resolves to a real PSP
 * account — there is no PSP integration in this product, so "valid" here
 * means "well-formed enough to embed in a upi://pay URI," nothing more.
 */
export function isValidVpaFormat(vpa: string): boolean {
  if (/\s/.test(vpa)) return false;
  const parts = vpa.split('@');
  if (parts.length !== 2) return false;
  const [local, handle] = parts;
  return local.length > 0 && handle.length > 0;
}
