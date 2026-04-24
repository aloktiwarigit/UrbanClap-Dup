import { HttpRequest } from '@azure/functions';
import { verifyFirebaseIdToken } from '../services/firebaseAdmin.js';

export async function verifyTechnicianToken(
  req: HttpRequest
): Promise<{ uid: string }> {
  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.replace('Bearer ', '');
  if (!token) throw new Error('No token');
  const decoded = await verifyFirebaseIdToken(token);
  return { uid: decoded.uid };
}
