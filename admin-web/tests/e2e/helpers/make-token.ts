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

// Firebase SDK parses the idToken as a JWT to extract exp/sub. The mock must
// be a valid JWT (3 dot-separated parts with a decodeable payload) or Firebase
// throws auth/internal-error before our page.route mock is even checked.
export async function makeFakeFirebaseIdToken(uid: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(E2E_SECRET);
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(uid)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}
