import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not defined');
    process.exit(1);
  }

  console.log('🔄 Running database migrations...');

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
    console.log('✅ Migrations completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
