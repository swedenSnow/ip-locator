import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { eq, lt } from 'drizzle-orm';

import { db } from '../db';
import { admins, sessions } from '../db/schema';

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(adminId: number): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.insert(sessions).values({
    adminId,
    sessionToken: token,
    expiresAt,
  });

  return token;
}

export async function validateSession(token: string) {
  const result = await db
    .select({
      admin: admins,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(eq(sessions.sessionToken, token))
    .limit(1);

  if (!result.length) return null;

  const { admin, session } = result[0];

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  return admin;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, token));
}

export async function cleanExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
}
