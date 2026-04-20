import { HttpRequest } from '@azure/functions';
import { getAuth } from 'firebase-admin/auth';

export async function verifyTechnicianToken(
  req: HttpRequest
): Promise<{ uid: string }> {
  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.replace('Bearer ', '');
  if (!token) throw new Error('No token');
  const decoded = await getAuth().verifyIdToken(token);
  return { uid: decoded.uid };
}
