import { SignJWT, jwtVerify } from 'jose';
import type { AdminRole } from '../types/admin.js';

export interface AccessTokenPayload {
  sub: string;
  role: AdminRole;
  sessionId: string;
  type: 'access';
  iat: number;
  exp: number;
}

export interface SetupTokenPayload {
  sub: string;
  email: string;
  type: 'totp-setup';
  iat: number;
  exp: number;
}

function jwtKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(s);
}

export async function signAccessToken(
  payload: Pick<AccessTokenPayload, 'sub' | 'role' | 'sessionId'>,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtKey());
}

export async function signSetupToken(
  payload: Pick<SetupTokenPayload, 'sub' | 'email'>,
): Promise<string> {
  return new SignJWT({ ...payload, type: 'totp-setup' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(jwtKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    if (payload['type'] !== 'access') return null;
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifySetupToken(
  token: string,
): Promise<SetupTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    if (payload['type'] !== 'totp-setup') return null;
    return payload as unknown as SetupTokenPayload;
  } catch {
    return null;
  }
}
