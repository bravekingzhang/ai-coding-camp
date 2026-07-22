import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret-change-me');
const COOKIE = 'camp_session';

export type Session = { userId: string; empId: string; name: string; roles: string[]; mustChangePassword?: boolean };

export async function createSession(s: Session) {
  const token = await new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** 当前用户在进行中一期的 Enrollment（平台大多数页面的入口查询） */
export async function getActiveEnrollment(userId: string) {
  return prisma.enrollment.findFirst({
    where: { userId, cohort: { status: 'RUNNING' } },
    include: { cohort: true, group: true, user: { include: { roles: true } } },
  });
}

export function hasRole(session: Session | null, ...roles: string[]) {
  if (!session) return false;
  return session.roles.some((r) => roles.includes(r));
}
