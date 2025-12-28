import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

import { LogLevel, serverLog } from '../utils/console';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', err => {
    serverLog(LogLevel.ERROR, 'database', err);
});

export const db = drizzle(pool, { schema });
