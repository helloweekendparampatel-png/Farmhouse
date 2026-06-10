import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const [type, token] = auth.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
}

export function requireAuth(req: NextRequest): JwtPayload {
  const token = getAuthToken(req);
  if (!token) {
    throw new Error('Unauthorized');
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new Error('Unauthorized');
  }
  return payload;
}

export function requireRole(req: NextRequest, roles: Role[]): JwtPayload {
  const payload = requireAuth(req);
  if (!roles.includes(payload.role)) {
    throw new Error('Forbidden');
  }
  return payload;
}
