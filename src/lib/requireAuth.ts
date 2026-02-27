import { verifyJwt } from './authUtils';

export function requireAuth(req: Request): { userId: string } {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) throw new Error('Unauthorized');
  const payload = verifyJwt(token);
  return { userId: payload.userId as string };
}
