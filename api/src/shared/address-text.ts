export function normalizeAddressText(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
