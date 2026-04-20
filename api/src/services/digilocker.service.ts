/**
 * Server-side DigiLocker OAuth2 code exchange.
 * SECURITY: The full Aadhaar number from the XML response is NEVER stored.
 * Only the last 4 digits are extracted and returned as a masked string.
 */
export async function exchangeCodeForAadhaar(
  authCode: string,
  redirectUri: string
): Promise<{ maskedNumber: string } | null> {
  if (!authCode) return null;

  const clientId = process.env['DIGILOCKER_CLIENT_ID'];
  const clientSecret = process.env['DIGILOCKER_CLIENT_SECRET'];
  if (!clientId || !clientSecret) {
    throw new Error('DigiLocker env vars not configured');
  }

  const tokenRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: authCode,
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json() as { access_token?: string };
  if (!tokenData.access_token) return null;

  const eKycRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/3/xml/eaadhaar', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!eKycRes.ok) return null;
  const xmlText = await eKycRes.text();

  // Extract last 4 digits from UID attribute — NEVER store the full number
  const uidMatch = xmlText.match(/uid="(\d{12})"/);
  if (!uidMatch) return null;
  const last4 = uidMatch[1].slice(-4);
  return { maskedNumber: `XXXX-XXXX-${last4}` };
}
