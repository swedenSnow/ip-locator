import type { InferSelectModel } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

import { validateSession } from './auth';

import type { admins } from '../db/schema';

type Admin = InferSelectModel<typeof admins>;

interface NextApiRequestWithAdmin extends NextApiRequest {
  admin: Admin;
}

export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await validateSession(sessionToken);

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach admin to request for use in handler
    (req as NextApiRequestWithAdmin).admin = admin;

    return handler(req, res);
  };
}
