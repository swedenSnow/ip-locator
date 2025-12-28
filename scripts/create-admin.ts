import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';
import { stdin as input, stdout as output } from 'process';
import * as readline from 'readline/promises';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function createAdmin() {
  const rl = readline.createInterface({ input, output });
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    console.log('\n=== Create Admin User ===\n');

    // Get username
    const username = await rl.question('Enter username: ');

    if (!username || username.trim().length === 0) {
      console.error('Error: Username cannot be empty');
      process.exit(1);
    }

    // Check if username already exists
    const existingCheck = await pool.query(
      'SELECT id FROM admins WHERE username = $1',
      [username.trim()]
    );

    if (existingCheck.rows.length > 0) {
      console.error(`Error: User "${username}" already exists`);
      process.exit(1);
    }

    // Get password
    const password = await rl.question('Enter password: ');

    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters long');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await rl.question('Confirm password: ');

    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\nHashing password...');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert admin
    console.log('Creating admin user...');
    const result = await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username.trim(), passwordHash]
    );

    const admin = result.rows[0];
    console.log(`\n✓ Admin user "${admin.username}" created successfully!`);
    console.log(`User ID: ${admin.id}`);
    console.log(`Created at: ${admin.created_at}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\nError creating admin:', error);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
