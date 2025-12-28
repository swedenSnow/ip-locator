import { serialize } from 'cookie';
import { eq } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse } from 'next';

import { db } from '../../../db';
import { admins } from '../../../db/schema';
import { verifyPassword, createSession } from '../../../lib/auth';
import { LogLevel, serverLog } from '../../../utils/console';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Query admin by username
    const adminRecords = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username))
      .limit(1);

    if (adminRecords.length === 0) {
      // Generic error message to not leak whether username exists
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = adminRecords[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionToken = await createSession(admin.id);

    // Update last login timestamp
    await db
      .update(admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(admins.id, admin.id));

    // Set httpOnly cookie
    const cookie = serialize('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true });
  } catch (error) {
    serverLog(LogLevel.ERROR, 'auth/login', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
