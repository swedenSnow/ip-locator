import { desc, count } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse } from 'next';

import { db } from '../../db';
import { visits } from '../../db/schema';
import { withAuth } from '../../lib/withAuth';
import { LogLevel, serverLog } from '../../utils/console';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;

    const safeLimit = Math.min(Math.max(parseInt(limitParam || '100') || 100, 1), 1000);
    const safeOffset = Math.max(parseInt(offsetParam || '0') || 0, 0);

    const visitsData = await db.select()
      .from(visits)
      .orderBy(desc(visits.visitedAt))
      .limit(safeLimit)
      .offset(safeOffset);

    const countResult = await db.select({ total: count() })
      .from(visits);

    res.status(200).json({
      visits: visitsData,
      total: countResult[0]?.total || 0,
      limit: safeLimit,
      offset: safeOffset,
    });
  } catch (error) {
    serverLog(LogLevel.ERROR, 'api/visits', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
}

export default withAuth(handler);
