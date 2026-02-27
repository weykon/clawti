import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const JWT_SECRET = () => process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';

// --- Password hashing (scrypt, no external deps) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(key, 'hex'), derived);
}

// --- Minimal JWT (HS256, no external deps) ---

export function signJwt(payload: Record<string, unknown>, expiresInSec = 60 * 60 * 24 * 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSec })).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, body, sig] = parts;
  const expected = createHmac('sha256', JWT_SECRET()).update(`${header}.${body}`).digest('base64url');
  if (sig !== expected) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}
