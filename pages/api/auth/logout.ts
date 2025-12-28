import { serialize } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

import { deleteSession } from '../../../lib/auth';
import { LogLevel, serverLog } from '../../../utils/console';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionToken = req.cookies.session;

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken);
    }

    // Clear cookie
    const cookie = serialize('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true });
  } catch (error) {
    serverLog(LogLevel.ERROR, 'auth/logout', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
