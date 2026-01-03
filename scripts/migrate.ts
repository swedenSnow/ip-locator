import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { LogLevel, serverLog } from '../utils/console';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    serverLog(LogLevel.ERROR, 'migrate', 'DATABASE_URL is not defined');
    process.exit(1);
  }

  serverLog(LogLevel.INFO, 'migrate', 'Running database migrations...');

  const pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('render.com')
      ? { rejectUnauthorized: false }
      : undefined,
    max: 1,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './db/migrations' });
    serverLog(LogLevel.INFO, 'migrate', 'Migrations completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    serverLog(LogLevel.ERROR, 'migrate', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
