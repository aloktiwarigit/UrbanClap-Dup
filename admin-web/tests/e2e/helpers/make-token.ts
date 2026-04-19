import { SignJWT } from 'jose';

const E2E_SECRET = process.env['JWT_SECRET'] ?? 'e2e-test-jwt-secret-placeholder-min32chars!';

export async function makeAccessJwt(sub: string, role: string): Promise<string> {
  const secret = new TextEncoder().encode(E2E_SECRET);
  return new SignJWT({ type: 'access', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}
